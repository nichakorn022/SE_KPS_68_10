const registrationService = require("../services/registrationService");
const { query } = require("../utils/dbHelpers");
const { sendRegistrationConfirmation } = require("../utils/mailer");

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

      // Send email notification
      try {
        const { event_id, user_id } = req.body;
        const [[user], [event]] = await Promise.all([
          query("SELECT username, email FROM users WHERE user_id = ? LIMIT 1", [user_id]),
          query("SELECT title, event_date FROM event WHERE event_id = ? LIMIT 1", [event_id]),
        ]);
        if (user?.email && event?.title) {
          sendRegistrationConfirmation({
            to: user.email,
            username: user.username,
            eventTitle: event.title,
            eventDate: event.event_date,
          }).catch((err) => console.error("Registration email failed:", err.message));
        }
      } catch (mailErr) {
        console.error("Registration email lookup failed:", mailErr.message);
      }

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

  static async updateRegistrationStatus(req,res){

    try{

      const data = await registrationService.updateRegistrationStatus(req.params.id, req.body.status);

      res.json(data);

    }catch(err){

      res.status(err.statusCode || 500).json({error:err.message});

    }

  }

  static async deleteRegistration(req,res){

    try{

      const data = await registrationService.deleteRegistration(req.params.id);

      res.json(data);

    }catch(err){

      res.status(err.statusCode || 500).json({error:err.message});

    }

  }

}

module.exports = RegistrationController;
