import { Schema, model } from 'mongoose';

const User = new Schema(
    {
        name: { type: String, required: true },
        userName: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
    },
    { timestamps: true, strict: false }, // set the strict option to false
);

export default model('User', User);