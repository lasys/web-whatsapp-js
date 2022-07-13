const express = require('express');

const router = express.Router();
const WhatsApp = require('../whatsapp/whatsapp');

let whatsApp = new WhatsApp();

router.get('/', (req, res) => {
  res.send({ message: 'Hello world!' });
});

router.get('/status', (req, res) => {
  res.send( whatsApp.status );
});

router.get('/login', (req, res) =>  {
  whatsApp.init();
  res.send('Init WhatsAppClient' );
});

router.get('/logout', (req, res) =>  {
  // TODO: remove WhatsApp Instance
  res.send('Logout WhatsAppClient' );
});

router.get('/qr', (req, res) =>  {
  res.send( whatsApp.qr_code );
});

router.get('/chats', async (req, res) => {
  if (!whatsApp.isReady) {
    res.status(500).send('WhatsApp is not ready!')
    return;
  }
  try {
    let chats = await whatsApp.get_chats();
    res.send( chats );
  } catch (e) {
    return res.status(500).send(e);
  }

});

router.get('/chats/:chatId/messages', async (req, res) => {
  let chatId = req.params.chatId;
  let limit = req.query.limit;

  if (!whatsApp.isReady) {
    res.status(500).send('WhatsApp is not ready!')
    return;
  }
  try {
    let messages = await whatsApp.get_messages(chatId, limit);
    res.send(messages);
  } catch (e) {
    return res.status(500).send(e);
  }

});

router.get('/chats/:chatId/picture', async (req, res) => {
  let chatId = req.params.chatId;

  if (!whatsApp.isReady) {
    res.status(500).send('WhatsApp is not ready!')
    return;
  }

  try {
    let pictureUrl = await whatsApp.get_profile_pic_url(chatId);
    res.redirect( pictureUrl );
  } catch (e) {
    return res.status(500).send(e);
  }

});

router.post('/chats/:chatId/message', async (req, res) => {
  let chatId = req.params.chatId;
  let content = req.body;

  if (!whatsApp.isReady) {
    res.status(500).send('WhatsApp is not ready!')
    return;
  }

  if (!chatId || !content) {
    return res.status(400).send("No chatId or message provided");
  }
  try {
    let message = await whatsApp.send_message(chatId, content);
    res.send(message);
  } catch (e) {
    return res.status(500).send(e);
  }

});

router.get('/messages/:messageId', async (req, res) => {
  let messageId = req.params.messageId;

  if (!whatsApp.isReady) {
    res.status(500).send('WhatsApp is not ready!')
    return;
  }

  try {
    let message = await whatsApp.get_message_by_id(messageId);
    res.set('Content-Type', message.mimetype);
    res.send(message.data);
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;
