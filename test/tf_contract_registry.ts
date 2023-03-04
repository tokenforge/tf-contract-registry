import {ethers, upgrades} from 'hardhat';
import chai from 'chai';

import chaiAsPromised from 'chai-as-promised';
import shallowDeepEqual from 'chai-shallow-deep-equal';

import {TFContractRegistry, TFContractRegistry__factory} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {loadFixture} from "ethereum-waffle";


chai.use(chaiAsPromised);
chai.use(shallowDeepEqual);

const {expect} = chai;

describe('TFContractRegistry BasicTests', () => {
    let 
        deployer: SignerWithAddress,
        axel: SignerWithAddress,
        ben: SignerWithAddress,
        chantal: SignerWithAddress
    ;

    async function deployRegistry() {
        const factory = (await ethers.getContractFactory('TFContractRegistry', deployer)) as TFContractRegistry__factory;

        const registry = await factory.deploy();
        await registry.deployed();

        return {registry, deployer};
    }

    beforeEach(async () => {
        [deployer, axel, ben, chantal] = await ethers.getSigners();
    })

    describe('we can register contracts', async () => {

        it('deployer should be able to register contracts successfully', async () => {
            const {registry, deployer} = await loadFixture(deployRegistry);

            expect(registry.registerContract("contract://factory/anneliese", 43114,"0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D"))
                .to.emit(registry, 'ContractRegistered')
                .withArgs(
                    deployer.address,
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("contract://factory/anneliese")),
                    43114,
                    "0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D"
                );

            expect(registry.registerContract("contract://factory/frank", 137,"0xbd3afb0bb76683ecb4225f9dbc91f998713c3b01"))
                .to.emit(registry, 'ContractRegistered')
                .withArgs(
                    deployer.address,
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("contract://factory/frank")),
                    137,
                    "0xbd3Afb0bB76683eCb4225F9DBc91f998713C3b01"
                );

            expect(registry.registerContract("contract://factory/frank", 43114,"0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D"))
                .to.emit(registry, 'ContractRegistered')
                .withArgs(
                    deployer.address,
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("contract://factory/frank")),
                    43114,
                    "0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D"
                );
            
            expect(await registry.getContract("contract://factory/anneliese", 43114)).to.eq("0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D");
            expect(await registry.getContract("contract://factory/frank", 137)).to.eq("0xbd3Afb0bB76683eCb4225F9DBc91f998713C3b01");

            expect(await registry.getContractByHash(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("contract://factory/frank")), 43114)).to.eq("0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D");
            
            expect(await registry.getContracts("contract://factory/anneliese")).to.shallowDeepEqual([
                {
                    networkId: 43114,
                    contractAddress: '0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D'
                },
            ])

            expect(await registry.getContractsByHash(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("contract://factory/anneliese")))).to.shallowDeepEqual([
                {
                    networkId: 43114,
                    contractAddress: '0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D'
                },
            ])

            expect(await registry.getContracts("contract://factory/frank")).to.shallowDeepEqual([
                {
                    networkId: 137,
                    contractAddress: '0xbd3Afb0bB76683eCb4225F9DBc91f998713C3b01'
                },
                {
                    networkId: 43114,
                    contractAddress: '0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D'
                },
            ])

        });

    })
    
    describe('Permission related', async() => {
        
        it('all permissions are set as expected by default', async() => {
            const {registry, deployer} = await loadFixture(deployRegistry);
            
            expect(await registry.hasRole(await registry.REGISTRAR_ROLE(), deployer.address)).to.be.true;
            expect(await registry.hasRole(await registry.REGISTRAR_ROLE(), axel.address)).to.be.false;
            expect(await registry.hasRole(await registry.REGISTRAR_ROLE(), ben.address)).to.be.false;
            expect(await registry.hasRole(await registry.REGISTRAR_ROLE(), chantal.address)).to.be.false;
        })

        it('Axel should not be allowed to register contracts', async () => {
            const {registry} = await loadFixture(deployRegistry);

            const axelAsSigner = registry.connect(axel);
            
            await expect(axelAsSigner.registerContract("key_1", 1,"0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D"))
                .to.be.revertedWith('TFContractRegistry: caller has no governor role and no admin role')
        })

        it('Enable Axel to be allowed to register contracts', async () => {
            const {registry} = await loadFixture(deployRegistry);

            await registry.grantRole(await registry.REGISTRAR_ROLE(), axel.address);
            
            const axelAsSigner = registry.connect(axel);
            
            await expect(axelAsSigner.registerContract("contracts://factory/anneliese", 5, "0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D"))
                .to.emit(axelAsSigner, 'ContractRegistered')
                .withArgs(
                    axel.address,
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("contracts://factory/anneliese")),
                    5,
                    "0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D"
                );
            

            expect(await registry.getContract("contracts://factory/anneliese", 5)).to.eq("0x36fFe38DEfDcfd48a4016cFE79F3AFcDAfFe123D");
        })

    });
    
});

