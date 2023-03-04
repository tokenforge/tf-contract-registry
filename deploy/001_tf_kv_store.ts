import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {DefenderRelayProvider, DefenderRelaySigner} from "defender-relay-client/lib/ethers";
import {CreateRelayerRequest, RelayClient, RelayerParams} from "defender-relay-client";
import {appendFileSync, writeFileSync} from "fs";
import {ethers} from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, execute, log, read} = deployments;

    const {deployer} = await getNamedAccounts();
    console.log("Deployer", deployer)

    const instance = await deploy('TFKvStoreV1', {
        from: deployer,
        log: true,
        proxy: {
            proxyContract: "OpenZeppelinTransparentProxy",
            execute: {
                methodName: "initialize",
                args: [],
            }
        },
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });

    log("Contract: " + instance.address);
    log("- Transaction: " + instance.transactionHash);

    log("Ready.");
};

export default func;
func.dependencies = [];
func.tags = ['TokenForge1155v3Factory'];
