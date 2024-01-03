import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { YoutubeTranscript } from 'youtube-transcript';
import fetchVideoInfo from "updated-youtube-info";

import User from './models/user.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Stripe from 'stripe';
dotenv.config();
const stripe = new Stripe(process.env.STRIPE_API_KEY);

const app = express();

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true })
  .catch(error => console.log('Connection error', error.message))

app.use(
  cors({
    origin: ["http://localhost:3003", "https://uscribed.com", "https://www.uscribed.com", "phpstack-984670-3803318.cloudwaysapps.com", `${process.env.DOMAIN_URL}`],
    credentials: true,
  })
);

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/hello", (req, res) => {
  res.send("Hello, World.");
});

app.post('/api/register', bodyParser.json(), async (req, res) => {
  const { name, userName, email, password } = req.body;

  if (!(name && email && password && userName)) {
    res.status(400).json({ error: "All Input Is Required" });
    return;
  }

  const oldEmail = await User.findOne({ email });
  const oldUserName = await User.findOne({ userName });

  if (oldEmail) {
    return res.status(409).json({ error: "An Account With This Email Address Already Exists." });
  } else if (oldUserName) {
    return res.status(409).json({ error: "An Account With This Username Already Exists." });
  }

  const encryptedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    userName,
    email: email.toLowerCase(),
    password: encryptedPassword,
    role: "user",
    registered_on: "uscribed"
  });

  const token = jwt.sign(
    { user_id: user._id, email },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );

  const userResponse = {
    email: user.email,
    userName: user.userName,
    profession: user.profession,
    role: user.role,
    registered_on: user.registered_on,
    token // add the token here
  };

  return res.status(201).json(userResponse);
});

app.post('/api/login', bodyParser.json(), async (req, res) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.status(402).json({ error: "All Input Is Required" });
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {

    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.JWT_SECRET,
      {
        expiresIn: "168h",
      }
    );

    const userResponse = {
      email: user.email,
      userName: user.userName,
      profession: user.profession,
      role: user.role,
      token // add the token here
    };

    return res.status(200).json(userResponse);
  }
  res.status(401).json({ error: "Invalid Credentials" });
});

app.get('/api/check-user', bodyParser.json(), async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.user_id);
    if (!user) {
      return res.status(400).json({ error: 'User Not Found' });
    }
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid Request' });
  }
});

/////////////Stripe///////////////////
app.post("/api/stripe-create-checkout-session", bodyParser.json(), async (req, res) => {
  const { priceId, email, name } = req.body;

  console.log(name);

  // Check if the user with the email exists in the database

  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(400).send({ error: "This email is not registered with uscribed, please use your login email" });
  }

  // Check if a customer with this email already exists in Stripe
  const customers = await stripe.customers.list({ email: email });

  let customerId;
  if (customers.data.length > 0) {
    // If a customer with this email already exists
    customerId = customers.data[0].id;
  } else {
    // If a customer with this email does not exist
    const customer = await stripe.customers.create({ email: email, name: name });
    customerId = customer.id;
  }

  // Creating a checkout session for the customer.
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', // or 'payment' for a one-time payment or 'subscription' for a recurring
    payment_method_types: ['card'],
    customer: customerId,
    // customer_email: email, // Here we're linking the session with an existing customer by providing the customer's email.
    line_items: [
      { price: priceId, quantity: 1 }
    ],
    success_url: `${process.env.DOMAIN_URL}`,
    cancel_url: `${process.env.DOMAIN_URL}`,
  });

  res.send({
    sessionId: session.id,
  });
});

//Webhook endpoint
app.post('/api/stripe-webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  console.log("Webhook triggered");

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    // console.log("Got event");
  }
  catch (err) {
    // console.log("Error getting event\n");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {

    const session = event.data.object;

    // Find email in the user database
    const user = await User.findOne({ email: session.customer_details.email });

    if (user) {
      await User.updateOne(
        { email: session.customer_details.email },
        {
          country: session.customer_details.address.country,
        }
      );
    }
  }

  // Listen to invoice.payment_succeeded events
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;

    const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);

    const user = await User.findOne({ email: invoice.customer_email });

    if (user) {
      await User.updateOne(
        { email: invoice.customer_email },
        {
          $push: {
            paymentHistory: {
              invoiceId: invoice.id,
              paymentDate: invoice.created,
              customerId: invoice.customer,
              description: invoice.lines.data[0].description,
              paymentIntentId: invoice.payment_intent,
              paymentMethodId: paymentIntent.payment_method,
              planStart: invoice.lines.data[0].period.start,
              planEnd: invoice.lines.data[0].period.end,
              currency: invoice.currency,
              amount: invoice.lines.data[0].plan.amount,
              amount_decimal: invoice.lines.data[0].plan.amount_decimal,
              quantity: invoice.lines.data[0].quantity,
              subscriptionId: invoice.subscription,
              planPriceId: invoice.lines.data[0].plan.id,
              productId: invoice.lines.data[0].plan.product,
              livemode: invoice.livemode,
            },
          },
        }
      );
    }
  }

  res.json({ received: true });
});

///Check subscription
app.post("/api/check_subscription", bodyParser.json(), async (req, res) => {
  const { email, priceId } = req.body;

  const customerList = await stripe.customers.list({
    email: email,
  });

  let customerId = null;
  if (customerList.data[0] && customerList.data[0].id) {
    customerId = customerList.data[0].id;
  } else {
    return res.status(400).json({ error: "User is not a subscriber", activeSubscription: false });
  }

  // Check if the user has an active subscription for the productId
  const subscription = await stripe.subscriptions.list({
    customer: customerId,
    price: priceId,
    status: 'active',
  });

  if (subscription.data.length === 0) {
    return res.status(400).json({ error: "User doesn't have active subscription for this product", activeSubscription: false });
  }

  return res.status(200).json({ activeSubscription: true, customerId: customerId, priceId: priceId });
});
///////////////////////////////

const getVideoId = (url) => {
  const match = url.match(/(?:v\=|be\/|list=)([^&|\?|\/]+)/);
  return match ? match[1] : null;
}

app.post('/api/fetch-transcript', bodyParser.json(), async (req, res) => {
  const { link } = req.body;

  try {
    const videoId = getVideoId(link);
    let videoInfoError = null;
    let transcriptError = null;
    let videoInfo = null;
    let transcript = null;

    const options = {
      lang: 'en'
    };

    // Fetching transcript
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId, options);
    } catch (error) {
      console.error("[Transcript Error]", error);
      transcriptError = error;
    }

    // Fetching video info
    try {
      videoInfo = await fetchVideoInfo(videoId);
    } catch (error) {
      console.error("[VideoInfo Error]", error);
      videoInfoError = error;
    }

    if (videoInfoError || transcriptError) {
      return res.json({
        videoInfo: videoInfo ? videoInfo : { error: videoInfoError.message },
        transcript: transcript ? transcript : { error: transcriptError.message }
      });
    }

    res.json({
      videoInfo,
      transcript
    });

  } catch (err) {
    console.error("[General Error]", err);
    res.sendStatus(500);
  }
});

app.listen(8003, (error) => {
  if (error) {
    console.error("Error starting the server:", error);
  } else {
    console.log("Server is running on http://localhost:8003");
  }
});