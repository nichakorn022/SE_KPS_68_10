const sponsorService = require("../services/sponsorService");

class SponsorController {

  static async requestSponsor(req,res){

    try{

      const id = await sponsorService.requestSponsor(req.body);

      res.json({
        message:"Sponsor request sent",
        sponsor_id:id
      });

    }catch(err){

      res.status(500).json({error:err.message});

    }

  }

  static async approveSponsor(req,res){

    try{

      await sponsorService.approveSponsor(req.params.id);

      res.json({message:"Sponsor approved"});

    }catch(err){

      res.status(500).json({error:err.message});

    }

  }

  static async getSponsorRequests(req,res){

    try{

      const data = await sponsorService.getAllSponsorRequests();

      res.json(data);

    }catch(err){

      res.status(500).json({error:err.message});

    }

  }



}

module.exports = SponsorController;