const sgMail = require('@sendgrid/mail');

// API is hidden for security
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'dacs2012@gmail.com',
        subject: 'Welcome!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.` // reference to template
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'dacs2012@gmail.com',
        subject: 'Goodbye!',
        text: `We will miss you ${name}. How can we improve our services?`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}