const registrationService = require("../services/registrationService");
const { query } = require("../utils/dbHelpers");
const { sendRegistrationConfirmation, sendEventPaymentConfirmation } = require("../utils/mailer");

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

  static async confirmPayment(req,res){

    try{

      const { id } = req.params;
      const userId = req.user.user_id;

      // Verify the registration exists and belongs to this user
      const registrationRows = await query(
        `SELECT user_id FROM event_registration WHERE registration_id = ? LIMIT 1`,
        [id]
      );

      if (registrationRows.length === 0) {
        return res.status(404).json({message: "Registration not found"});
      }

      if (String(registrationRows[0].user_id) !== String(userId)) {
        return res.status(403).json({message: "You can only confirm your own payment"});
      }

      const data = await registrationService.updateRegistrationStatus(id, "confirmed");

      // Send event payment confirmation email
      try {
        const [[user], [reg]] = await Promise.all([
          query("SELECT username, email FROM users WHERE user_id = ? LIMIT 1", [userId]),
          query(
            `SELECT e.title, e.event_date FROM event_registration r
             JOIN event e ON e.event_id = r.event_id
             WHERE r.registration_id = ? LIMIT 1`,
            [id]
          ),
        ]);
        if (user?.email && reg?.title) {
          sendEventPaymentConfirmation({
            to: user.email,
            username: user.username,
            eventTitle: reg.title,
            eventDate: reg.event_date,
          }).catch((err) => console.error("Event payment email failed:", err.message));
        }
      } catch (mailErr) {
        console.error("Event payment email lookup failed:", mailErr.message);
      }

      res.json({
        message: "Payment confirmed",
        registration_status: "confirmed"
      });

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
