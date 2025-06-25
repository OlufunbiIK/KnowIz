const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// 🔐 Get email credentials from environment variables
const GMAIL_EMAIL = functions.config().gmail.email || process.env.GMAIL_EMAIL;
const GMAIL_APP_PASSWORD =
  functions.config().gmail.password || process.env.GMAIL_APP_PASSWORD;

// Create transporter
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_APP_PASSWORD,
  },
});

// 📧 Cloud Function that runs when a new user signs up
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const email = user.email;
  const displayName = user.displayName || "User";

  console.log(`New user created: ${email}`);

  const mailOptions = {
    from: `"Quiz App" <${GMAIL_EMAIL}>`,
    to: email,
    subject: `Welcome to Quiz App! 🎉`,
    text:
      `Hi ${displayName},\n\nWelcome to Quiz App! Thanks for ` +
      `signing up with Google.\n\nGet ready to enjoy amazing quizzes ` +
      `and learn something new every day!\n\nBest regards,\nThe Quiz ` +
      `App Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; 
        margin: 0 auto;">
        <h2 style="color: #4285f4;">Welcome to Quiz App! 🎉</h2>
        <p>Hi <strong>${displayName}</strong>,</p>
        <p>Welcome to Quiz App! Thanks for signing up with Google.</p>
        <p>Get ready to enjoy amazing quizzes and learn something new 
          every day!</p>
        <div style="background-color: #f8f9fa; padding: 20px; 
          border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #4285f4;">What's Next?</h3>
          <ul>
            <li>Explore our quiz categories</li>
            <li>Take your first quiz</li>
            <li>Track your progress</li>
            <li>Challenge your friends</li>
          </ul>
        </div>
        <p>If you have any questions, feel free to reach out to us.</p>
        <p>Best regards,<br/>The Quiz App Team</p>
        <hr style="border: none; border-top: 1px solid #eee; 
          margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This email was sent because you signed up for Quiz App.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully to:", email);
    return {success: true};
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Don't throw error to prevent function failure
    return {success: false, error: error.message};
  }
});
