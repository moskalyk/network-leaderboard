import React from 'react';
import logo from './logo.svg';
import './App.css';
import { ethers } from 'ethers'
import { SequenceIndexerClient } from '@0xsequence/indexer'
import { Box, Button, AddIcon, RadioGroup, IconButton, useTheme, Modal, TextInput, CheckmarkIcon, GradientAvatar } from '@0xsequence/design-system'

const fullIndexerPagination = async (indexer: any, address: string) => {
  const txs: any = []

  // here we query the Joy contract address, but you can use any
  const contractAddress = address;
  console.log(contractAddress)
  const filter = {
      contractAddress: address,
  };

  // query Sequence Indexer for all token transaction history on Mumbai
  let txHistory = await indexer.getTransactionHistory({
      filter: filter,
      page: { pageSize: 10 }
  })

  
  txs.push(...txHistory.transactions)

  // if there are more transactions to log, proceed to paginate
  while(txHistory.page.more){  
      txHistory = await indexer.getTransactionHistory({
          filter: filter,
          page: { 
              pageSize: 10, 
              // use the after cursor from the previous indexer call
              after: txHistory!.page!.after! 
          }
      })
      txs.push(...txHistory.transactions)
  }

  return txs
}

function App() {
  const [lists, setLists] = React.useState<any>([])
  const {theme, setTheme} = useTheme()
  const [modal, setModal] = React.useState<boolean>(false)
  const [totalIsClicked, setTotalIsClicked] = React.useState(true)
  const [mostIsClicked, setMostIsClicked] = React.useState(true)
  const [leastIsClicked, setLeastIsClicked] = React.useState(true)
  const [isIndexable, setIsIndexable] = React.useState(false)
  const [address, setAddress] = React.useState<any>(null)
  const [network, setNetwork] = React.useState('polygon')

  React.useEffect(() => {
    const indexer = new SequenceIndexerClient('https://mumbai-indexer.sequence.app')

    let interval = setInterval(() => {
      console.log('indexing')

      const newArry = [...lists]
      lists.map(async (list: any, index: any) => {

        let topRanked: any = []
        let txs;

        if(list[2] == 'mainnet'){
          const indexer = new SequenceIndexerClient('https://mainnet-indexer.sequence.app')
          txs = await fullIndexerPagination(indexer, list[1])
        } else if(list[2] == 'polygon') {
          const indexer = new SequenceIndexerClient('https://polygon-indexer.sequence.app')
          txs = await fullIndexerPagination(indexer, list[1])
        } else {
          const indexer = new SequenceIndexerClient('https://mumbai-indexer.sequence.app')
          txs = await fullIndexerPagination(indexer, list[1])
        }

        console.log(txs)

        const leaderboardRaw = new Map()

        txs.map((tx: any) => {
          tx.transfers.map((transfer: any) => {
            if(transfer.from != '0x0000000000000000000000000000000000000000'){
              if(!leaderboardRaw.has(transfer.to)){
                leaderboardRaw.set(transfer.to, Number(BigInt(transfer.amounts[0]) / BigInt(1e18)))
              }else {
                leaderboardRaw.set(transfer.to, Number(leaderboardRaw.get(transfer.to))+Number(BigInt(transfer.amounts[0]) / BigInt(1e18)))
              }
            }
          })
        })

        console.log(leaderboardRaw)

        const sortedMap = new Map([...leaderboardRaw.entries()].sort((a, b) => a[1] - b[1]));
        topRanked = [...sortedMap.keys()]
        newArry[index] = [lists[index][0], lists[index][1], lists[index][2], ...topRanked]
        setLists(newArry)
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [lists])

  const addList = async () => {
    setModal(true)
  }

  const removeList = async () => {

  }

  const saveList = async () => {
    console.log(address)
    setLists((prev: any) => {
      return [...prev, [totalIsClicked ? 'total' : mostIsClicked ? 'most' : 'least', address, network ]]
    })
    setModal(false)
    resetModal()
  }

  const total = () => {
    setTotalIsClicked(true)
    setMostIsClicked(false)
    setLeastIsClicked(false)
  }

  const most = () => {
    setTotalIsClicked(false)
    setMostIsClicked(true)
    setLeastIsClicked(false)
  }

  const least = () => {
    setTotalIsClicked(false)
    setMostIsClicked(false)
    setLeastIsClicked(true)
  }

  const onChangeInput = (value: any) => {
    if(ethers.utils.isAddress(value.target.value)){
      setAddress(value.target.value)
      setIsIndexable(true)
    }
  }

  const resetModal = () => {
    setTotalIsClicked(true)
    setMostIsClicked(true)
    setLeastIsClicked(true)
    setAddress(null)
    setIsIndexable(false)
  }

  const resetFilters = () => {
    setTotalIsClicked(true)
    setMostIsClicked(true)
    setLeastIsClicked(true)
  }

  return (
    <div className="App">
      <br/>
      <br/>
      <br/>
      <p className='title'>
        ntwrk-leaderboard
      </p>
      <div className='board'>
        <br/>
       <Box justifyContent='center' alignItems='center'>
        <IconButton  icon={AddIcon} onClick={() => {
          addList()
        }}/>
      </Box>
        {lists.map((list: any) => {
          if(list[0] == 'total'){
            return <div className='title-top-score'>
                <p className='header'>{list[0]}  for {list[1] ? list[1].slice(0,6) : null}.. on {list[2]}</p>
                <br/>
                {list.slice(3,list.length).map((el: any) => {
                  return <Box style={{margin: '10px'}} justifyContent='center' alignItems='center'><GradientAvatar address={el}/><p className='item'> {el.slice(0,6)}...</p></Box>
                })}
            </div>
          } else if(list[0] == 'least'){
            return <div className='title-top-time'>
              <p className='header'>{list[0]} for {list[1] ? list[1].slice(0,6) : null}.. on {list[2]}</p>
              <br/>
              {list.slice(3,list.length).map((el: any) => {
                  return <p className='item'>{el}</p>
                })}
            </div>
          } else if(list[0] == 'most'){
            return <div className='title-top-movement'>
              <p className='header'>{list[0]} for {list[1] ? list[1].slice(0,6) : null}.. on {list[2]}</p>
              <br/>
              {list.slice(3,list.length).map((el: any) => {
                  return <p className='item'>{el}</p>
                })}
            </div> 
          }
        })}
      </div> 
      {
        modal ? <Modal size='sm' style={{margin: '20px'}} onClose={() => {
          setModal(false)
          resetModal()
        }}>
          <br/>
          <Box justifyContent='center' alignItems='center'>
            <p className='header'>network</p>
          </Box>
          <br/>
          <Box justifyContent='center'>
            <RadioGroup size='lg' gap='10' flexDirection="row" value={network} onValueChange={(value) => {
              resetModal()
              resetFilters()
              setNetwork(value)
            }}name="network" options={[{'label': "mainnet", value: 'mainnet'},{'label': "polygon", value: 'polygon'},{'label': "mumbai", value: 'mumbai'},]}/>
          </Box>
          <br/>
          <Box justifyContent='center' alignItems='center'>
            <p className='header'>filter type</p>
          </Box>
          <Box justifyContent='center' alignItems='center'>
            <Button onClick={() => total()} disabled={!totalIsClicked} label='total' leftIcon={AddIcon} style={{margin: '20px', background: 'hotpink'}}/>
            <Button onClick={() => least()} disabled={!leastIsClicked} label='least' leftIcon={AddIcon} style={{margin: '20px', background: 'rgb(110, 0, 161)'}}/>
            <Button onClick={() => most()} disabled={!mostIsClicked} label='most' leftIcon={AddIcon} style={{margin: '20px', background: 'rgb(0, 158, 161)'}}/>
          </Box>
          <br/>
          {
            (network && (!totalIsClicked || !mostIsClicked || !leastIsClicked)) ? 
            <>
              <Box justifyContent='center' alignItems='center'>
                <TextInput placeholder='ERC20 Contract Address' onChange={(evt: any) => onChangeInput(evt)}></TextInput>

              </Box>
              <br/>
              {
                (isIndexable) 
                ? 
                <>
                  <Box justifyContent='center' alignItems='center' style={{margin: '20px'}}>
                    <p className='header' style={{textAlign: 'center'}}>filtering by the "{totalIsClicked ? 'total' : mostIsClicked ? 'most' : 'least'}" ERC20 token transfers</p> 
                  </Box>
                  <Box justifyContent='center' alignItems='center'>
                    <IconButton onClick={() => saveList()} icon={CheckmarkIcon} style={{margin: '20px'}}/>
                  </Box> 
                </> : null
              }
              <br/>
            </>
            : 
            null
          }
        </Modal> 
        : 
        null
      }
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
    </div>
  );
}

export default App;