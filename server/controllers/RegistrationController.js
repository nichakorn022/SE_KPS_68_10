const registrationService = require("../services/registrationService");

class RegistrationController {

  static async getRegistrations(req,res){

    try{

      const data = await registrationService.getRegistrations();

      res.json(data);

    }catch(err){

      res.status(500).json({error:err.message});

    }

  }

  static async registerEvent(req,res){

    try{

      const id = await registrationService.registerEvent(req.body);

      res.json({
        message:"Registered successfully",
        registration_id:id
      });

    }catch(err){

      res.status(500).json({error:err.message});

    }

  }

  static async cancelRegistration(req,res){

    try{

      await registrationService.cancelRegistration(req.params.id);

      res.json({
        message:"Registration cancelled"
      });

    }catch(err){

      res.status(500).json({error:err.message});

    }

  }

  static async getUserRegistrations(req,res){

    try{
      if (!req.user || (String(req.user.user_id) !== String(req.params.userId) && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const data = await registrationService.getUserRegistrations(req.params.userId);

      res.json(data);

    }catch(err){

      res.status(500).json({error:err.message});

    }

  }

}

module.exports = RegistrationController;
