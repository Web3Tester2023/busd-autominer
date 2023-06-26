import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react'
import { Parallax } from "react-parallax";
import AOS from 'aos';
import 'aos/dist/aos.css';
import './App.css';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useContract } from 'wagmi'
import wealthMountainABI from './contracts/WealthMountainBSC.json';
import styled from "styled-components";
import { Tabs, Tab, TabPanel } from "./components/tabs/tabs";
import { FaCopy, FaWallet, FaUserShield, FaSearchDollar } from 'react-icons/fa';

import logoImg from "./assets/img/logos/logo.svg";
import lotteryBanner from "./assets/lottery_banner.gif";

import {
    Button,
    Card,
    ButtonDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    CardDeck,
    Container,
    Col,
    FormGroup,
    Form,
    Input,
    InputGroup,
    Label,
    Table,
    Row
} from "reactstrap";
import { ethers, Contract } from 'ethers';
import { height } from '@mui/system';


AOS.init({ duration: 2000 });
const TabsContainer = styled.div`
  display: flex;
  padding: 2px;
`;


function WealthMountain() {
    const [sliderValue, setSliderValue] = useState('50');
    const [dropdownOpen, setOpen] = React.useState(false);
    const [userInfo, setUserInfo] = useState([]);
    const [activeTab, setActiveTab] = useState(1);
    const [calcTotalDividends, setCalcTotalDividends] = useState("")
    const [initalStakeAfterFees, setInitalStakeAfterFees] = useState("")
    const [dailyPercent, setDailyPercent] = useState("");
    const [dailyValue, setDailyValue] = useState("");
    const [stakingAmount, setStakingAmount] = useState("");
    const [calculatedDividends, setCalculatedDividends] = useState(0);
    const [contractBalance, setContractBalance] = useState("");
    const [referralAccrued, setReferralAccrued] = useState("");
    const [totalUsers, setTotalUsers] = useState("");
    // const [totalCompounds, setTotalCompounds] = useState("")
    // const [totalCollections, setTotalCollections] = useState("")
    const [dayValue10, setDayValue10] = useState("864000");
    const [dayValue20, setDayValue20] = useState("1728000");
    const [dayValue30, setDayValue30] = useState("2592000");
    const [dayValue40, setDayValue40] = useState("3456000");
    const [dayValue50, setDayValue50] = useState("4320000");
    const [contract, setContract] = useState(undefined)
    const [signer, setSigner] = useState(undefined)
    const [userWalletAddress, setUserWalletAddress] = useState('none');
    const [userStablecoinBalance, setUserStablecoinBalance] = useState(0);
    const [stablecoinAllowanceAmount, setStablecoinAllowanceAmount] = useState(0);
    const stableCoin = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
    const wealthContract = '0x73634D388dAD52eC1BB9C61A41934c269D11f338'
    const [refBonusLoading, setRefBonusLoading] = useState(false);
    const [connectButtonText, setConnectButtonText] = useState('CONNECT')

    // const [countdown, setCountdown] = useState({
    //     alive: true,
    //     days: 0,
    //     hours: 0,
    //     minutes: 0,
    //     seconds: 0
    // })

    // const getCountdown = (deadline) => {
    //     const now = Date.now() / 1000;
    //     const total = deadline - now;
    //     const seconds = Math.floor((total) % 60);
    //     const minutes = Math.floor((total / 60) % 60);
    //     const hours = Math.floor((total / (60 * 60)) % 24);
    //     const days = Math.floor(total / (60 * 60 * 24));

    //     return {
    //         total,
    //         days,
    //         hours,
    //         minutes,
    //         seconds
    //     };
    // }

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         try {
    //             const data = getCountdown(1662138120)
    //             setCountdown({
    //                 alive: data.total > 0,
    //                 days: data.days,
    //                 hours: data.hours,
    //                 minutes: data.minutes,
    //                 seconds: data.seconds
    //             })
    //         } catch (err) {
    //             console.log(err);
    //         }
    //     }, 1000);

    //     return () => clearInterval(interval);
    // }, [])

    async function requestAccount() {
        console.log('Requesting account...');

        // ❌ Check if Meta Mask Extension exists 
        if (window.ethereum) {
            if (window.ethereum.chainId != "0x38") {
                window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: "0x38",
                        rpcUrls: ["https://bsc-dataseed1.binance.org"],
                        chainName: "BSC Mainnet",
                        nativeCurrency: {
                            name: "BNB",
                            symbol: "BNB",
                            decimals: 18
                        },
                        blockExplorerUrls: ["https://bscscan.com"]
                    }]
                }).then(() => {
                    window.location.reload()
                });
            };
            console.log('detected');

            // if (window.ethereum.chainId != "0x61") {
            //     window.ethereum.request({
            //         method: "wallet_addEthereumChain",
            //         params: [{
            //             chainId: "0x61",
            //             rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
            //             chainName: "BSC Mainnet",
            //             nativeCurrency: {
            //                 name: "BNB",
            //                 symbol: "BNB",
            //                 decimals: 18
            //             },
            //             blockExplorerUrls: ["https://bscscan.com"]
            //         }]
            //     }).then(() => {
            //         window.location.reload()
            //     });
            // };
            // console.log('detected');

            try {

                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });

                setUserWalletAddress(accounts[0]);
                if (userWalletAddress != 'none') {
                    setConnectButtonText('CONNECTED')
                    recalculateInfo();
                }

            } catch (error) {
                console.log('Error connecting...');
            }

        } else {
            alert('Meta Mask not detected');
        }
    }
    useEffect(() => {
        const init = async () => {
            var provider = new ethers.providers.Web3Provider(window.ethereum)
            var signer = provider.getSigner()
            setSigner(signer)
            var contract = new Contract(
                wealthContract,
                wealthMountainABI,
                signer
            )
            setContract(contract)
            console.log(provider)
            setUserWalletAddress(provider.provider.selectedAddress);
            console.log(window.ethereum)
        };
        init();
    }, []);

    const handleChange = (e, value) => {
        setActiveTab(value);
        recalculateInfo()
    }
    window.addEventListener("focus", function () {
        recalculateInfo();
    })
    async function recalculateInfo() {
        if (contract === undefined || contract === null) {
            return;
        }

        contract.userInfo().then(value => {
            setUserInfo(value)
        })
        contract.calcdiv(userWalletAddress).then(value => {
            setCalculatedDividends(Number(ethers.utils.formatEther(value)));
        })
        const balance = await stablecoinBalance.balanceOf(contract.address);
        setContractBalance(Number(ethers.utils.formatEther(balance)));

        const userBalance = await stablecoinBalance.balanceOf(userWalletAddress);
        setUserStablecoinBalance(Number(ethers.utils.formatEther(userBalance)))



        const userAllowance = await stablecoinAllowance.allowance(userWalletAddress, contract.address);
        setStablecoinAllowanceAmount(Number(ethers.utils.formatEther(userAllowance)))

        contract.UsersKey(String(userWalletAddress)).then(value => {
            setReferralAccrued(Number(ethers.utils.formatEther(value.refBonus)).toFixed(2));
        })
        contract.MainKey(1).then(value => {
            setTotalUsers(Number(value.users));
            // setTotalCompounds(Number(value.compounds))
            // setTotalCollections(Number(ethers.utils.formatEther(value.ovrTotalWiths)))
        })
        contract.PercsKey(10).then(value => {
            setDayValue10(Number(value.daysInSeconds))
        })
        contract.PercsKey(20).then(value => {
            setDayValue20(Number(value.daysInSeconds))
        })
        contract.PercsKey(30).then(value => {
            setDayValue30(Number(value.daysInSeconds))
        })
        contract.PercsKey(40).then(value => {
            setDayValue40(Number(value.daysInSeconds))
        })
        contract.PercsKey(50).then(value => {
            setDayValue50(Number(value.daysInSeconds))
        })

    }
    const updateCalc = event => {
        setInitalStakeAfterFees(Number(event.target.value * 0.9).toFixed(2));
    }
    const updateStakingAmount = event => {
        setStakingAmount(event.target.value);
    }

    function calculate(v) {
        setSliderValue(v)
        if (Number(sliderValue) <= "20") {
            const totalReturn = (initalStakeAfterFees * 0.015) * sliderValue
            setCalcTotalDividends(totalReturn.toFixed(2));
            setDailyPercent(1.5);
            setDailyValue(Number(initalStakeAfterFees * .015).toFixed(2))
        }
        else if ("20" < Number(sliderValue) && Number(sliderValue) <= "30") {
            const totalReturn = (initalStakeAfterFees * 0.025) * sliderValue
            setCalcTotalDividends(totalReturn.toFixed(2));
            setDailyPercent(2.5);
            setDailyValue(Number(initalStakeAfterFees * .025).toFixed(2))
        }
        else if ("30" < Number(sliderValue) && Number(sliderValue) <= "40") {
            const totalReturn = (initalStakeAfterFees * 0.035) * sliderValue
            setCalcTotalDividends(totalReturn.toFixed(2));
            setDailyPercent(3.5);
            setDailyValue(Number(initalStakeAfterFees * .035).toFixed(2))
        }
        else if ("40" < Number(sliderValue) && Number(sliderValue) <= "50") {
            const totalReturn = (initalStakeAfterFees * 0.045) * sliderValue
            setCalcTotalDividends(totalReturn.toFixed(2));
            setDailyPercent(4.5);
            setDailyValue(Number(initalStakeAfterFees * .04).toFixed(2))
        }
        else if ("50" <= Number(sliderValue)) {
            const totalReturn = (initalStakeAfterFees * 0.055) * sliderValue
            setCalcTotalDividends(totalReturn.toFixed(2));
            setDailyPercent(5.5);
            setDailyValue(Number(initalStakeAfterFees * .055).toFixed(2))
        }
    }
    async function approveButton() {
        // if (stablecoinAllowanceAmount <= 0){
        //     let message = 
        //     "I am not the person or entities who reside in, are citizens of, are incorporated in, or have a registered office in the United States of America or any Prohibited Localities, as defined in the Terms of Use. I will not in the future access this site  while located within the United States any Prohibited Localities, as defined in the Terms of Use. I am not using, and will not in the future use, a VPN to mask my physical location from a restricted territory. I am lawfully permitted to access this site under the laws of the jurisdiction on which I reside and am located. I understand the risks associated with entering into using Wealth Mountain protocols."
        //     let signature = await signer.signMessage(message);
        // }
        const tx = stablecoinContract.approve(contract.address, String(ethers.utils.parseEther(stakingAmount)));
        tx.wait().then(() => {
            recalculateInfo()
        })
    }
    async function stakeAmount() {
        // if (Number(stakingAmount) < Number(50)) {
        //     alert('Minimum stake amount not met.')
        // }
        // if (Number(contractBalance) === 0 || Number(contractBalance) > Number(120000)) {
            // console.log("[AAAA===>]");
            const tx = await contract.stakeStablecoins(
                String(ethers.utils.parseEther(stakingAmount)), String("0x7d933a5Ee5Fad43b386bDDb9709805FAeB7f9709"));
            tx.wait().then(() => { setActiveTab(0) });
        // } else {
        //     console.log("[BBBB===>]");
        //     const tx = await contract.stakeStablecoins(
        //         String(ethers.utils.parseEther(stakingAmount)), String("0x7d933a5Ee5Fad43b386bDDb9709805FAeB7f9709"));
        //     tx.wait().then(() => { setActiveTab(0) });
        // }
        // const ref = window.location.search;
        // const referralAddress = String(ref.replace('?ref=', ''))
        // if (referralAddress == 'null' || referralAddress.includes("0x") == false) {
            // if (Number(stakingAmount) > Number(1000)) {
            //     const tx = await contract.stakeStablecoins(
            //         String(ethers.utils.parseEther(stakingAmount)), String("0x7d933a5Ee5Fad43b386bDDb9709805FAeB7f9709"));
            //     tx.wait().then(() => { setActiveTab(0) });
            // } 
            // else {
        //         const tx = await contract.stakeStablecoins(
        //             String(ethers.utils.parseEther(stakingAmount)), String("0x7d933a5Ee5Fad43b386bDDb9709805FAeB7f9709"));
        //         tx.wait().then(() => { setActiveTab(0) });
        //     // }

        // // } else if (Number(stakingAmount) >= Number(1000)) {
        // //     const tx = await contract.stakeStablecoins(
        // //         String(ethers.utils.parseEther(stakingAmount)), String("0x7d933a5Ee5Fad43b386bDDb9709805FAeB7f9709"));
        // //     tx.wait().then(() => { setActiveTab(0) });
        // } else if (referralAddress.includes("0x7d933a5Ee5Fad43b386bDDb9709805FAeB7f9709") == true) {
        //     const tx = await contract.stakeStablecoins(
        //         String(ethers.utils.parseEther(stakingAmount)), String("0x7d933a5Ee5Fad43b386bDDb9709805FAeB7f9709"));
        //     tx.wait().then(() => { setActiveTab(0) });
        // } else {
        //     const tx = await contract.stakeStablecoins(
        //         String(ethers.utils.parseEther(stakingAmount)), String(referralAddress));
        //     tx.wait().then(() => { setActiveTab(0) });
        // }
    }
    async function stakeRefBonus() {
        const tx = await contract.stakeRefBonus();
        tx.wait().then(() => {
            recalculateInfo();
        })

    }
    async function withdrawRefBonus() {
        const tx = await contract.withdrawRefBonus();
        tx.wait().then(() => {
            recalculateInfo();
        })
    }
    async function compound() {
        const tx = await contract.compound()
        tx.wait().then(() => {
            recalculateInfo();
        })
    }
    async function withdrawDivs() {
        const tx = await contract.withdrawDivs()
        tx.wait().then(() => {
            recalculateInfo();
        })
    }
    const stablecoinContract = useContract({
        addressOrName: stableCoin,
        contractInterface: ['function approve(address spender, uint amount) public returns(bool)'],
        signerOrProvider: signer,
    })
    const stablecoinBalance = useContract({
        addressOrName: stableCoin,
        contractInterface: ['function balanceOf(address account) external view returns (uint256)'],
        signerOrProvider: signer,
    })
    const stablecoinAllowance = useContract({
        addressOrName: stableCoin,
        contractInterface: ['function allowance(address _owner, address spender) external view returns (uint256)'],
        signerOrProvider: signer,
    })

    async function withdrawInitial(value) {
        const tx = await contract.withdrawInitial(value);
        tx.wait().then(() => {
            recalculateInfo();
        })
    }
    function TotalStakedValue() {
        var total = 0;
        for (var i = 0; i < userInfo.length; i++) {
            total += Number(ethers.utils.formatEther(userInfo[i].amt))
        }
        return (<>{total.toFixed(2)}</>)
    }
    function TotalEarnedValue() {
        var value = calculatedDividends;

        return (<>{value.toFixed(3)}</>)
    }

    function TotalEarnedPercent() {
        var total = 0;
        for (var i = 0; i < userInfo.length; i++) {
            total += Number(ethers.utils.formatEther(userInfo[i].amt))
        }
        const value = calculatedDividends
        var totalEarnedPercent = Number((value / total) * 100).toFixed(3) + "%";
        if (totalEarnedPercent === "NaN%") {
            totalEarnedPercent = 0
        }
        return (<>{totalEarnedPercent}</>)
    }

    function ListOfUserStakes() {
        if (userInfo.length == 0) {
            return (
                <>
                    <small className="font-weight-bold source text-lightblue">Nothing to show here.</small>
                </>
            )
        }
        const listElements = userInfo.map(
            (element) => {
                const depoStart = Number(element.depoTime)
                const depoAmount = Number(ethers.utils.formatEther(element.amt))
                const initialWithdrawn = element.initialWithdrawn;
                var dailyPercent = '';
                var unstakeFee = '';
                const elapsedTime = (Date.now() / 1000 - (depoStart));
                var totalEarned = '0';
                // var daysToMax = Number((dayValue50 - elapsedTime) / 86400).toFixed(1);
                var daysToMax = Number((dayValue50 - elapsedTime) / 86400).toFixed(1)
                if (elapsedTime <= dayValue20) {
                    dailyPercent = '1.5'
                    unstakeFee = '20%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue20 && elapsedTime <= dayValue30) {
                    dailyPercent = '2.5'
                    unstakeFee = '18%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue30 && elapsedTime <= dayValue40) {
                    dailyPercent = '3.5'
                    unstakeFee = '15%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue40 && elapsedTime <= dayValue50) {
                    dailyPercent = '4.5'
                    unstakeFee = '12%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue50) {
                    dailyPercent = '5.5'
                    unstakeFee = '12%'
                    totalEarned = depoAmount * (dailyPercent / 100) * (elapsedTime / dayValue10 / 10)
                    daysToMax = 'Max'
                }
                var daysStaked = Number(elapsedTime / 86400).toFixed(2);
                if (daysStaked < 1) {
                    daysStaked = "<1"
                }

                if (initialWithdrawn == false) {
                    return (
                        <>
                            <tr>
                                <td>${depoAmount.toFixed(2)}</td>
                                <td>{daysStaked}</td>
                                <td>{dailyPercent}%</td>
                                <td>{daysToMax}</td>
                                <td style={{ fontStyle: 'italic' }}>{unstakeFee}</td>
                            </tr>
                        </>
                    )
                }
            }
        )
        return (
            <>
                <Table striped>
                    <thead>
                        <tr className="text-lightblue calvino">
                            <th>Amount</th>
                            <th>Days staked</th>
                            <th>Daily (%)</th>
                            <th>Days to Max</th>
                            <th>Unstake fee</th>
                        </tr>
                    </thead>
                    <tbody className="source text-white">
                        {listElements}
                    </tbody>
                </Table>
            </>
        )
    }

    function UnstakeOptions() {
        if (userInfo.length == 0) {
            return (
                <>
                    <Button outline className="custom-button mt-3 source" onClick={() => { setActiveTab(1) }}>Start a stake to see your info</Button>
                </>
            )
        }
        const listElements = userInfo.map(
            (element) => {
                // const depoStart = new Date(element.depoTime / 1000).toDateString();
                const depoStart = new Date(Number(element.depoTime) * 1000).toDateString()
                const depoAmount = Number(ethers.utils.formatEther(element.amt)).toFixed(2)
                const initialWithdrawn = element.initialWithdrawn;
                const key = Number(element.key);
                if (initialWithdrawn == false) {
                    return (
                        <>
                            <DropdownItem onClick={() => {
                                withdrawInitial(key)
                            }}>
                                <Col className="text-center">
                                    <Row>${depoAmount}</Row>
                                    <Row><small className="text-muted">{depoStart}</small></Row>
                                </Col>
                            </DropdownItem>
                            <div></div>
                        </>
                    )
                }
            }
        )
        return (
            <>
                <ButtonDropdown className="custom-button source mt-4" toggle={() => { setOpen(!dropdownOpen) }}
                    isOpen={dropdownOpen}>
                    <DropdownToggle outline caret className="font-weight-bold source">
                        Unstake
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem header style={{ color: 'black' }}>Your current stakes
                        </DropdownItem>
                        {listElements}
                    </DropdownMenu>
                </ButtonDropdown>
            </>
        )
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //    RENDER
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    return (
        <>
            <Container className="custom-header">
                <Card className="px-5 py-2">
                    <img
                        alt="..."
                        src={logoImg}
                        style={{ width: 'auto', height: '36px' }}
                    />
                </Card>
                
                <Button
                    className='custom-button'
                    style={{maxHeight: "43px"}}
                    onClick={requestAccount}>
                    {connectButtonText}
                </Button>
            </Container>
            <Container>
                <Button
                    style={{background: 'transparent', border: 'none'}} 
                    onClick={()=>setActiveTab(2)}>
                    <img
                        alt="..."
                        src={lotteryBanner}
                        style={{ width: '100%', marginTop: '10px', border: '1px solid rgb(66 45 14)', borderRadius: '10px'}}
                    />
                </Button>
            </Container>
            {/* <Container>
                {countdown.alive && 
                    <>
                    <h3 style={{textAlign: "center"}}>LAUNCH COUNTDOWN</h3>
                    <h3 style={{textAlign: "center"}}>
                    {`${countdown.days} Days, ${countdown.hours} Hours, ${countdown.minutes} Mins & ${countdown.seconds} Secs`}
                    </h3>
                    </>
                }
            </Container> */}
            <Container className="pt-3">
                <Container>
                    <CardDeck>
                        <Card body className="text-center text-lightblue">
                            <h5 className="calvino text-lightblue">TVL</h5>
                            <h5 className="source font-weight-bold text-white">
                                {Number(contractBalance) === 0 ? <>?</> : <>${Number(contractBalance).toFixed(0)}</>}
                            </h5>
                        </Card>
                        <Card body className="text-center text-lightblue">
                            <h5 className="calvino text-lightblue">USERS</h5>
                            <h5 className="source font-weight-bold text-white">
                                {Number(totalUsers) === 0 ? <>?</> : <>{Number(totalUsers)}</>}
                            </h5>
                        </Card>
                        <Card body className="text-center text-lightblue">
                            <h5 className="calvino text-lightblue">STAKE FEE</h5>
                            <h5 className="source font-weight-bold text-white">
                                10%
                            </h5>
                        </Card>
                        <Card body className="text-center text-lightblue">
                            <h5 className="calvino text-lightblue">COLLECTION FEE</h5>
                            <h5 className="source font-weight-bold text-white">
                                10%
                            </h5>
                        </Card>
                    </CardDeck>
                </Container>
                <TabsContainer className="pt-3">
                    <Tabs selectedTab={activeTab} onChange={handleChange}>
                        <Tab label="CURRENT STAKES & YIELD" value={0}></Tab>
                        <Tab label="ENTER STAKE" value={1}></Tab>
                        <Tab label="LOTTERY" value={2}></Tab>
                    </Tabs>
                </TabsContainer>

                <TabPanel value={activeTab} selectedIndex={0}>
                    <Row>
                        <Col></Col>
                        <Col className="text-center">
                        </Col>
                        <Col></Col>
                    </Row>
                    <CardDeck className="p-3">
                        <Card body className="text-center text-lightblue">
                            <h4 className="calvino text-lightblue">TOTAL STAKED VALUE</h4>
                            <h1 className="source font-weight-bold text-white">$<TotalStakedValue /></h1>
                            <UnstakeOptions />
                        </Card>
                        <Card body className="text-center text-lightblue">
                            <h4 className="calvino text-lightblue">TOTAL EARNINGS</h4>
                            <CardDeck>
                                <Card style={{background: "transparent"}}>
                                    <h4 className="source font-weight-bold text-white"><TotalEarnedPercent /></h4>
                                </Card>
                                <Card style={{background: "transparent"}}>
                                    <h4 className="source font-weight-bold text-white">$<TotalEarnedValue /></h4>
                                </Card>
                            </CardDeck>
                            <Row>
                                <Col>
                                    <Button className="custom-button source mt-3" outline onClick={compound}>compound</Button>
                                    <Button className="custom-button source mt-3" outline onClick={withdrawDivs}>collect</Button>
                                </Col>
                            </Row>
                            <small className="pt-2 source">Note: Collecting will reset all stakes to 1.5% daily. Compound will add to your stakes while doing the same.</small>
                        </Card>
                    </CardDeck>
                    <CardDeck className="pl-3 pr-3 pb-3">
                        <Card body className="text-center text-lightblue">
                            <h5 className="calvino text-lightblue">REFERRALS EARNED</h5>
                            {refBonusLoading ? <></> :
                                <>
                                    <h4 className="source font-weight-bold text-white">${referralAccrued}</h4>
                                    <Row>
                                        <Col>
                                            <Button className="custom-button source mt-2" outline onClick={stakeRefBonus}>STAKE</Button>
                                            <Button className="custom-button source mt-2" outline onClick={withdrawRefBonus}>COLLECT</Button>
                                        </Col>
                                    </Row>
                                </>}

                        </Card>
                        <Card body className="text-center text-lightblue">
                            <h5 className="calvino text-lightblue">REFERRAL LINK</h5>
                            <h3 type="button" onClick={() => navigator.clipboard.writeText("https://unitystake.xyz?ref=" + userWalletAddress)} className="referralButton source font-weight-bold"><FaCopy size="1.6em" className="pr-3" />COPY LINK</h3>
                            <small className="source text-lightblue">Earn 10% UNITY when someone uses your referral link.</small>
                        </Card>
                    </CardDeck>
                    <CardDeck className="pt-2 pr-3 pl-3 pb-3">
                        <Card body className="text-center text-lightblue">
                            <h4 className="calvino text-lightblue" style={{ lineHeight: "10px" }}>CURRENT STAKES</h4>
                            <small className="pt-0 pb-4 source">Here's a list of all of your current stakes.</small>
                            <ListOfUserStakes />
                        </Card>
                        <Card hidden body className="text-center text-lightblue">
                            <h4 className="calvino text-lightblue">Days Staked</h4>
                            <h3 className="source font-weight-bold text-white">2 days</h3>
                        </Card>
                        <Card hidden body className="text-center text-lightblue">
                            <h4 className="calvino text-lightblue">Time to Max</h4>
                            <CardDeck>
                                <Card>
                                    <h4 className="source font-weight-bold text-white">?</h4>
                                    <small className="source">days until max</small>
                                </Card>
                                <Card>
                                    <h4 className="source font-weight-bold text-white">$</h4>
                                    <small className="source">max per day</small>
                                </Card>
                            </CardDeck>
                        </Card>
                        <Card hidden body className="text-center text-lightblue">
                            <h4 className="calvino text-lightblue">Current Unstake Fee</h4>
                            <h3 className="source font-weight-bold text-white">20%</h3>
                            <small className="source text-lightblue">days until decrease to 12%</small>
                        </Card>
                    </CardDeck>
                </TabPanel>
                <TabPanel value={activeTab} selectedIndex={1}>
                    <CardDeck className="p-3">
                        <Card body className="text-center text-lightblue">
                            <h4 className="calvino text-lightblue">ENTER STAKE</h4>
                            <p className="source text-center">Approve and stake your UNITY here. You can view your ongoing stakes in the <span className="font-weight-bold">Current Stakes & Yield</span> tab.</p>
                            <Form>
                                <FormGroup>
                                    <Label className="source font-weight-bold text-lightblue">STAKE AMOUNT</Label>
                                    <InputGroup>
                                        <Input
                                            className="custom-input text-center source"
                                            placeholder="MINIMUM 10 Billion UNITY"
                                            onChange={updateStakingAmount}
                                        ></Input>
                                    </InputGroup>
                                    <Button onClick={approveButton} className="custom-button mt-4 source font-weight-bold">APPROVE</Button>
                                    <Button onClick={stakeAmount} className="custom-button mt-4 source font-weight-bold">STAKE</Button>
                                </FormGroup>
                            </Form>
                            <small className="source text-lightblue">Note: Stakes are not locked. You can unstake at any time.</small><br />
                            <small className="source text-lightblue text-left"><FaWallet size="1.7em" className="pr-2" />Your wallet: <span className="text-white font-weight-bold">{userStablecoinBalance.toFixed(2)} UNITY</span></small>
                            <small className="source text-lightblue text-left"><FaUserShield size="1.7em" className="pr-2" />Approved amount: <span className="text-white font-weight-bold">{stablecoinAllowanceAmount.toFixed(2)} UNITY</span></small>
                            <a className="source text-left text-underline text-lightblue" href="https://unitymine.network/presale" target="_blank" rel="noreferrer"><small className="source text-lightblue text-left"><FaSearchDollar size="1.7em" className="pr-2" />BUY UNITY here. </small></a>
                        </Card>
                        <Card body className="source text-center">
                            <h4 className="calvino text-lightblue">IMPORTANT INFORMATION</h4>
                            <p className="text-left"> <span className="font-weight-bold">Stake or unstake at any time. </span>When a new stake is made, overall yield accrual is set to 1.5% until day 20.</p>
                            <p className="text-left"><span className="font-weight-bold">Approval is required </span>prior to staking your UNITY. The protocol will only request approval for the amount entered.</p>
                            <p className="text-left"><span className="font-weight-bold">Staking fee is a flat 10%. </span>Use the Earnings Calculator to determine how much a stake will earn daily.</p>
                            <small className="text-left">Disclaimer: Dividend payouts will take place at a flat rate. Payouts continue contingent on Smart Contract health and liquidity.</small>
                            <small className="pt-3 text-center font-weight-bold">
                                <Link className="text-lightblue" to="/faq">For further questions, please read our DOCS</Link>
                            </small>
                        </Card>
                    </CardDeck>

                    <Parallax strength={500}>
                        <div>
                        <Container className="pb-3 pt-3 calvino text-center">
                            <CardDeck>
                            <Card data-aos="fade-right" data-aos-duration="800" className="p-3">
                                <h3>DIVIDENDS</h3>

                                <table className="source" border="2">
                                <tbody>
                                    <tr>
                                    <td className="font-weight-bold">Level</td>
                                    <td className="font-weight-bold">Stake Length</td>
                                    <td className="font-weight-bold">Earnings</td>
                                    </tr>
                                    <tr>
                                    <td>1</td>
                                    <td>Day 1 - 20</td>
                                    <td>1.5% daily</td>
                                    </tr>
                                    <tr>
                                    <td>2</td>
                                    <td>Day 20 - 30</td>
                                    <td>2.5% daily</td>
                                    </tr>
                                    <tr>
                                    <td>3</td>
                                    <td>Day 30 - 40</td>
                                    <td>3.5% daily</td>
                                    </tr>
                                    <tr>
                                    <td>4</td>
                                    <td>Day 40 - 50</td>
                                    <td>4.5% daily</td>
                                    </tr>
                                    <tr>
                                    <td>♛ 5 </td>
                                    <td>Day 50 - ∞</td>
                                    <td>5.5% daily</td>
                                    </tr>
                                </tbody>
                                </table>
                                <br />
                                <small className="source">Compounding and collecting earnings from dividends reset all stakes to level 1. Creating new stakes has no effect on existing stakes.</small>
                                <br />

                                <small className="source">Disclaimer: Dividend payouts are fixed and the TVL fluctuations do not effect the daily yield like in traditional miners.</small>
                            </Card>
                            <Card data-aos="fade-down" data-aos-duration="800" className="p-3">
                                <h3>UNSTAKE FEES</h3>

                                <table className="source" border="2">
                                <tbody>
                                    <tr>
                                    <td className="font-weight-bold">Stake Length</td>
                                    <td className="font-weight-bold">Unstake Fee</td>
                                    </tr>
                                    <tr>
                                    <td>Day 1 - 10</td>
                                    <td>20%</td>
                                    </tr>
                                    <tr>
                                    <td>Day 10 - 20</td>
                                    <td>18%</td>
                                    </tr>
                                    <tr>
                                    <td>Day 20 - 30</td>
                                    <td>15%</td>
                                    </tr>
                                    <tr>
                                    <td>Day 30 - ∞</td>
                                    <td>12%</td>
                                    </tr>
                                </tbody>
                                </table>
                                <br /><small className="source">Dividends earned are also paid out when unstakes take place.</small>
                                <br /><small className="source">Volume in and out of the protocol help the platform thrive. Fees are diversified across different asset classes and diversification vehicles.</small>
                            </Card>
                            <Card data-aos="fade-left" data-aos-duration="800" className="p-3">
                                <h3>STAKING</h3>
                                <span className="source text-center pl-2 pb-2 pr-3">
                                10% fee on intial stakes<br /><br />
                                Stakes immediately start earning 1.5% daily<br /><br />
                                Unstake at any time (earnings included)<br /><br />
                                Unstake fees start at 20% and decrease to 12%<br /><br />
                                10% fee on dividend collections<br /><br />
                                No fees on compounds
                                </span>
                            </Card>
                            </CardDeck>
                        </Container>
                        </div>
                    </Parallax>
                </TabPanel>

                <TabPanel value={activeTab} selectedIndex={2}>
                    <h4 className="pt-5 text-center text-white">(COMING SOON)</h4>
                    <CardDeck className="p-5">
                        
                        <Card body className="text-center text-lightblue">
                            <h4 className="calvino text-lightblue">LOTTERY</h4>

                            {/* <Box component="div" className='p-2 pb-5'>
                                <Grid
                                container
                                alignItems="center"
                                justifyContent="space-between"
                                >
                                    <Typography style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        POT SIZE
                                    </Typography>
                                    <Typography className="text-white" style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        $0
                                    </Typography>
                                </Grid>

                                <Grid
                                container
                                alignItems="center"
                                justifyContent="space-between"
                                >
                                    <Typography style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        TOTAL PLAYERS
                                    </Typography>
                                    <Typography className="text-white" style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        0
                                    </Typography>
                                </Grid>

                                <Grid
                                container
                                alignItems="center"
                                justifyContent="space-between"
                                >
                                    <Typography style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        TOTAL TICKETS
                                    </Typography>
                                    <Typography className="text-white" style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        0
                                    </Typography>
                                </Grid>

                                <Grid
                                container
                                alignItems="center"
                                justifyContent="space-between"
                                >
                                    <Typography style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        MY TICKETS
                                    </Typography>
                                    <Typography className="text-white" style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        0
                                    </Typography>
                                </Grid>

                                <Grid
                                container
                                alignItems="center"
                                justifyContent="space-between"
                                >
                                    <Typography style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        PROBABILITY OF WINNING
                                    </Typography>
                                    <Typography className="text-white" style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        0
                                    </Typography>
                                </Grid>

                                <Grid
                                container
                                alignItems="center"
                                justifyContent="space-between"
                                >
                                    <Typography style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        PREVIOUS WINNER
                                    </Typography>
                                    <Typography className="text-white" style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        0
                                    </Typography>
                                </Grid>

                                <Grid
                                container
                                alignItems="center"
                                justifyContent="space-between"
                                >
                                    <Typography style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        PREVIOUS POT SIZE
                                    </Typography>
                                    <Typography className="text-white" style={{fontFamily: 'Open Sans', fontSize: '16px', fontWeight: 'bold'}} gutterBottom>
                                        0
                                    </Typography>
                                </Grid>
                            </Box>

                            <Form>
                                <FormGroup>
                                    <InputGroup>
                                        <Input
                                            className="custom-input text-center source"
                                            placeholder="ENTER TICKETS AMOUNT"
                                            disabled
                                        ></Input>
                                    </InputGroup>
                                </FormGroup>
                            </Form>

                            <Button className="custom-button source mt-3" style={{width: '100%'}} outline onClick={()=>{}} disabled>buy tickets</Button>
                            <Button className="custom-button source mt-3" style={{width: '100%'}} outline onClick={()=>{}} disabled>collect winnings</Button>
                            <Button className="custom-button source mt-3" style={{width: '100%'}} outline onClick={()=>{}} disabled>send to miner (100% bonus)</Button> */}
                        </Card>
                    </CardDeck>
                </TabPanel>

                { activeTab !== 2 &&
                <Container className="pt-3">
                    <Card body>
                        <h2 className="calvino text-center text-lightblue">EARNINGS CALCULATOR</h2>
                        <CardDeck>
                            <Card body className="text-center">
                                <h3 className="calvino font-weight-bold text-lightblue">STAKING</h3>
                                <Form>
                                    <FormGroup>
                                        <Label className="source font-weight-bold text-lightblue">STAKE AMOUNT</Label>
                                        <InputGroup>
                                            <Input
                                                className="custom-input text-center source"
                                                placeholder="MINIMUM 10 Billion UNITY"
                                                // onChange={(e) => this.setCalcAmount(`${e.target.value}`)}
                                                onChange={updateCalc}
                                            ></Input>
                                        </InputGroup>
                                    </FormGroup>
                                </Form>
                                <Label className="source font-weight-bold text-lightblue">DAYS STAKED</Label>
                                <Col className="text-center">
                                    <Box>
                                        <Slider
                                            defaultValue={50}
                                            aria-label="Default"
                                            valueLabelDisplay="auto"
                                            color='primary'
                                            onChange={(_, v) => calculate(v)} />
                                    </Box>
                                </Col>
                            </Card>
                            <Card body className="text-center">
                                <h3 className="calvino font-weight-bold text-lightblue">EARNINGS</h3>
                                <CardDeck>
                                    <Card style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                                        <h3 className="calvino text-white">${calcTotalDividends}</h3>
                                        <small className="source text-white">total dividends earned</small>
                                    </Card>
                                    <Card style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                                        <h3 className="calvino text-white">${initalStakeAfterFees}</h3>
                                        <small className="source text-white">initial stake after fees</small>
                                    </Card>
                                </CardDeck>
                                <CardDeck className="pt-3">
                                    <Card style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                                        <h3 className="calvino text-white">{dailyPercent}%</h3>
                                        <small className="source text-white">earning daily (%)</small>
                                    </Card>
                                    <Card style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                                        <h3 className="calvino text-white">${dailyValue}</h3>
                                        <small className="source text-white">earning daily ($)</small>
                                    </Card>
                                </CardDeck>
                            </Card>
                        </CardDeck>
                    </Card>
                </Container>
                }
                <Container className="pt-5 text-center calvino text-lightblue">
                    <Card body className="mb-3 p-1">
                        <CardDeck className="custom-footer">
                            <a href="https://unitymine.network/docs.pdf" target="_blank" rel="noreferrer"> DOCS </a>
                            <a href="https://t.me/unitymine" target="_blank" rel="noreferrer"> TWITTER </a>
                            <a href="https://twitter.com/UnityMine_Net" target="_blank" rel="noreferrer"> TELEGRAM </a>
                            <a href="https://bscscan.com/token/0x6acD17ea5D08F3227fD14c961923fdb224E50a89" target="_blank" rel="noreferrer"> CONTRACT </a>
                            
                        </CardDeck>
                    </Card>
                    <p style={{fontSize: '14px'}}>COPYRIGHT © 2023 UNITYMINE STAKING ALL RIGHTS RESERVED</p>
                </Container>
            </Container>
        </>

    )
}
export default WealthMountain;
