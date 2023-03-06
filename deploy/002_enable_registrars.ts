import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, execute, log, read} = deployments;

    const {deployer} = await getNamedAccounts();
    console.log("Deployer", deployer)

    const registry = await deployments.get('TFContractRegistry');
    console.log("TFContractRegistry-Address: ", registry.address);
    
    const roleId = await read('TFContractRegistry', 'REGISTRAR_ROLE');
    console.log('RoleID: ', roleId);
    const registrar = '0x1ABe0Cd4b606098a2C687c0B4367f60688E76d60';
    
    await execute(
        'TFContractRegistry',
        {from: deployer, log: true},
        "grantRole",
        roleId,
        registrar,
    );
    
    log("Ready.");
};

export default func;
func.dependencies = ['TFContractRegistry'];
func.tags = ['enable-registrars'];
