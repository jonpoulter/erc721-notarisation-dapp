const StarNotary = artifacts.require('StarNotary')

contract('StarNotary', accounts => { 

    let user1 = accounts[1]
    let user2 = accounts[2]
    let randomMaliciousUser = accounts[3] 

    let name = 'awesome star!'
    let starStory = 'I love my wonderful star'
    let ra = '032.155'
    let dec = '121.874'
    let mag =  '245.978'

    beforeEach(async function() { 
        this.contract = await StarNotary.new({from: accounts[0]})
    })
    
    describe('can create a star', () => { 
        it('user1 can create a star and get its name', async function () { 
            
            let tx = await this.contract.createStar(name, ra, dec, mag, starStory, {from: accounts[0]})
            const star = await this.contract.tokenIdToStarInfo(tx.logs[0].args.tokenId);
            assert.equal(star[1], 'awesome star!')
            assert.equal(star[2], '032.155')
        })
    })

    describe('star uniqueness', () => {

        it('only unique stars get minted', async function () {

            //mint star
            await this.contract.createStar(name, ra, dec, mag, starStory, {from: user1})
            //attempt to mint star again.
            const error = await expectThrow(this.contract.createStar(name, ra, dec, mag, starStory, {from: user1}));
            assert.ok(error.toString().includes('unfortunately the star with these coordinates is already taken!'));
        })

        it('only unique stars can be minted even though name is different', async function() {
            let newName = 'another star'
            //mint star
            await this.contract.createStar(name, ra, dec, mag, starStory, {from: user1})
            //attempt to mint star with new name
            const error = await expectThrow(this.contract.createStar(newName, ra, dec, mag, starStory, {from: user1}));
            assert.ok(error.toString().includes('unfortunately the star with these coordinates is already taken!'));
        })

        it('only unique stars can be minted even though starStory is different', async function() {
            let newStarStory = 'this is my story'
            //mint star
            await this.contract.createStar(name, ra, dec, mag, starStory, {from: user1})
            //attempt to mint star with new name
            const error = await expectThrow(this.contract.createStar(name, ra, dec, mag, newStarStory, {from: user1}));
            assert.ok(error.toString().includes('unfortunately the star with these coordinates is already taken!'));
        })

        it('minting unique stars does not fail', async function() { 
            for(let i = 0; i < 10; i ++) { 
                let id = i
                let newRa = i.toString()
                let newDec = i.toString()
                let newMag = i.toString()

                let tx = await this.contract.createStar(name, newRa, newDec, newMag, starStory, {from: user1})
                let starInfo = await this.contract.tokenIdToStarInfo(tx.logs[0].args.tokenId)
                assert.equal(starInfo[2], newRa)
            }
        })
    })

    describe('buying and selling stars', () => { 
        
        let starId = 1
        let starPrice = web3.toWei(.01, "ether")

        beforeEach(async function () { 
           let tx = await this.contract.createStar(name, ra, dec, mag, starStory, {from: user1})
           starId = tx.logs[0].args.tokenId;    
        })
        
        /** Also tests createStar() invokes ERC721 mint function by validating ownership as well as transfer event has been emiited and transaction is logged */
        it('user1 can put up their star for sale', async function () {
            assert.equal(await this.contract.ownerOf(starId), user1)
            await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            assert.equal(await this.contract.starsForSale(starId), starPrice)
        })

        it('user2 cannot put up star for sale', async function() {
            assert.equal(await this.contract.ownerOf(starId), user1)
            const error = await expectThrow(this.contract.putStarUpForSale(starId, starPrice, {from: user2}))
            assert.ok(error.toString().includes('not authorized to put star for sale'))
        })

         /** Also tests buyStar() invokes ERC721 _removeTokenFrom() and removeTokenTo() functions by validating ownership */
         describe('user2 can buy a star that was put up for sale', () => { 
            beforeEach(async function () { 
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            })

            it('user2 is the owner of the star after they buy it',  async function() {
                await this.contract.buyStar(starId, {from: user2, value: starPrice, gasPrice: 0})
                assert.equal(await this.contract.ownerOf(starId), user2)
            })

            /** Also tests buyStar() invokes ERC721 transfer() functions by validating balance of both buyer and seller */
            it('user2 ether balance changed correctly', async function () { 
                let overpaidAmount = web3.toWei(.05, 'ether')
                const user2BalanceBeforeTransaction = web3.eth.getBalance(user2)
                const user1BalanceBeforeTransaction = web3.eth.getBalance(user1)
                await this.contract.buyStar(starId, {from: user2, value: overpaidAmount, gasPrice: 0})
                const user2BalanceAfterTransaction = web3.eth.getBalance(user2)
                const user1BalanceAfterTransaction = web3.eth.getBalance(user1)

                assert.equal(user2BalanceBeforeTransaction.sub(user2BalanceAfterTransaction), starPrice)
                assert.equal(user1BalanceAfterTransaction.sub(user1BalanceBeforeTransaction), starPrice)
            })
        })

        describe('cannot buy a star', ()=> {

            it('only stars that are for sale can be bought', async function()  {

                const error = await expectThrow(this.contract.buyStar(starId, {from: user2, value: starPrice, gasPrice: 0}))
                assert.ok(error.toString().includes('star not for sale'))
            }) 

            it('insufficient funds to buy the star', async function() {
                let underpaidAmount = web3.toWei(.001, 'ether')
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
                const error = await expectThrow(this.contract.buyStar(starId, {from: user2, value: underpaidAmount, gasPrice: 0}))
                assert.ok(error.toString().includes('insufficient funds to buy star'))
            })
        }) 
    })

})

var expectThrow = async function(promise) { 
    try { 
        await promise
    } catch (error) { 
        assert.exists(error);
        return error;
    }

    assert.fail('Expected an error but didnt see one!')
}