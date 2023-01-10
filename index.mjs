import { Contract } from "ethers";
import { providers, utils } from "ethers";


async function main() {
    const firstBlockToScan = 37910240,
          lastBlockToScan = 37910250,
          cardAddress = "0x3d9e6bd43ac6afc78f3d8c8df6811d9ab53678c1",
          arenaAddress = "0x24c6f0c81cc8e6fc9348fb3ab5338f903a5b7959",
          arenaABI = [
             "event NewBet(address,uint256,uint256,uint8)",
          ],
          cardABI = [
              "function livesRemaining(uint256 cardId) external view returns(uint256)",
              "function getRarity(uint256 cardId) public view returns(uint8)",
              "function rewardMaintokens(uint256 cardId) external view returns(uint256)",
          ];

    const provider = new providers.JsonRpcProvider(process.env.RPC);

    const arenaContract = new Contract(arenaAddress, arenaABI, provider),
          cardContract = new Contract(cardAddress, cardABI, provider);

    const eventFilter = {
        address: arenaAddress,
        topics: [
            utils.id("NewBet(address,uint256,uint256,uint8)")
        ]
    }
    const events = await arenaContract.queryFilter(eventFilter, firstBlockToScan, lastBlockToScan)
    for (const event of events) {
        const cardId = event.args[2];
        console.log(`Created a bet by card ${cardId.toString()} to event ${event.args[1].toString()}`)
        const eventBlock = event.blockNumber;
        // We need to be careful here as God only knows what is a result of this call - state
        // before the block or after, hopefully after, and hopefully nothing wrong will happen.

        // TODO: Use 1inch's batcher
        const overrides = {blockTag: eventBlock}
        const livesAtTheMomentOfBet = await cardContract.callStatic.livesRemaining(cardId, overrides)
        const expectedReward = await cardContract.callStatic.rewardMaintokens(cardId, overrides)
        console.log(`At the moment of call remaining lives: ${livesAtTheMomentOfBet}, so if the bet is correct, win will be ${expectedReward}`)
    }
}

main().catch(e => console.log(e))