const { Client, LocalAuth, Chat, ChatId } = require('whatsapp-web.js');
const fs = require('fs');
const { exec } = require("child_process");

class WhatsApp {
    qr_code = "";
    status = "";
    isReady = false;

    constructor() {
        this.client = new Client({
            puppeteer: { headless: false },
            authStrategy: new LocalAuth('13299107891666257')
        });
    }

    init() {
        this.client.initialize();
        this.client.on('qr', (qr) => {
            this.qr_code = qr;
            this.status = "QR received: " + qr;
            console.log(this.status);
        });
        this.client.on('ready', () => {
            this.isReady = true;
            this.status = 'Client is ready!';
            console.log(this.status);
        });
        this.client.on('authenticated', () => {
            this.status = 'Client is authenticated!';
            console.log(this.status);
        });
        this.client.on('auth_failure', (error) => {
            this.status = 'Auth Failure: !' + error;
            console.log(this.status);
        });
        this.status = "initialized client"
        console.log(this.status);
    }

    async get_chats() {
        let chats = await this.client.getChats();
        let simplifiedChats = [];
        for (const chat of chats) {
            let sc = {id: chat.id._serialized, name: chat.name, isGroup: chat.isGroup};
            simplifiedChats.push(sc);
        }

        return simplifiedChats;
    }

    async get_messages(chatId, limit) {
        if (!limit) {
            limit = 10;
        }

        let chat = await this.client.getChatById(chatId);
        let messages = await chat.fetchMessages({limit: limit});
        let simplifiedMessages = [];
        for (const message of messages) {
            let sm = {
                id: message.id._serialized,
                fromMe: message.fromMe,
                content: message._data.body,
                type: message._data.type
            };
            simplifiedMessages.push(sm);
        }

        return simplifiedMessages;
    }

    async get_profile_pic_url(chatId) {
        return this.client.getProfilePicUrl(chatId)
    }

    async send_message(chatId, content) {
        let chat = await this.client.getChatById(chatId);
        let message = await chat.sendMessage(content);
        let sm = {
            id: message.id._serialized,
            fromMe: message.fromMe,
            content: message._data.body,
            type: message._data.type
        };
        return sm;
    }

    async get_message_by_id(messageId) {
        let message = await this.client.getMessageById(messageId);

        if (!message) {
            throw("Message not found!");
        }
        if (message._data.type !== "image" && message._data.type !== "ptt" && message._data.type !== "audio") {
            throw("Not a MediaMessage");
        }

        let mediaMessage = await message.downloadMedia();

        if (message._data.type === "image") {
            return mediaMessage;
        }

        try {
            if (mediaMessage.data) {
                // TODO: move temp-files into  temp-dir and better naming
                let buffer = Buffer.from(mediaMessage.data, 'base64');
                fs.writeFileSync('temp', buffer);

                let command = "ffmpeg -y -i temp -acodec libmp3lame temp.mp3";
                const command_exec = exec(command);
                // wait until command is really done! await not enough!
                await new Promise( (resolve) => {
                    command_exec.on('close', resolve)
                });

                let file = fs.readFileSync('temp.mp3');
                let data = Buffer.from(file, 'binary').toString('base64');
                mediaMessage.data = data;
            }

        } catch (err) {
            console.error(err);
            throw(err);
        }

        return mediaMessage;
    }
}

module.exports = WhatsApp // 👈 Export class
