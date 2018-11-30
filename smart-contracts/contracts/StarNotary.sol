pragma solidity ^0.4.23;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract StarNotary is ERC721 { 

    struct Star {
        uint256 tokenId; 
        string name; 
        string ra;
        string dec;
        string mag;
        string starStory;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; 
    mapping(uint256 => uint256) public starsForSale;

    function createStar(string _name, string _ra, string _dec, string _mag,  string _starStory) public {
        //create hash of coordinates and verify the star isn't already taken.  Highly improbable there will be a hash collision for different coordinates.
        uint256 _tokenId = createTokenId(_ra, _dec, _mag); 
        require(tokenIdToStarInfo[_tokenId].tokenId == 0, "unfortunately the star with these coordinates is already taken!"); 
        Star memory newStar = Star(_tokenId, _name, _ra, _dec, _mag, _starStory);

        tokenIdToStarInfo[_tokenId] = newStar;

        _mint(msg.sender, _tokenId);
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public { 
        require(this.ownerOf(_tokenId) == msg.sender, "not authorized to put star for sale");

        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable { 
        require(starsForSale[_tokenId] > 0, "star not for sale");
        
        uint256 starCost = starsForSale[_tokenId];
        address starOwner = this.ownerOf(_tokenId);
        require(msg.value >= starCost, "insufficient funds to buy star");

        //Use ERC721 helper functions to transfer star
        _removeTokenFrom(starOwner, _tokenId);
        _addTokenTo(msg.sender, _tokenId);
        
        //send the ether to the current owner
        starOwner.transfer(starCost);

        //send any change back to the new owner
        if(msg.value > starCost) { 
            msg.sender.transfer(msg.value - starCost);
        }
    }

     /** Helper Function to create a hash from the star coordinates  */
    function createTokenId(string _ra, string _dec, string _mag) private pure returns (uint256) {
     
        return uint256(keccak256(abi.encodePacked(_ra, _dec, _mag)));
    }
}