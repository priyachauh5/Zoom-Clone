import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import httpStatus from "http-status";
// import bcrypt, {hash} from "bcrypt";
import bcrypt from "bcryptjs";

import crypto from "crypto";

const login=async(req, res)=>{
    const{username, password}=req.body;
    if(!username || !password){
        return res.status(httpStatus.BAD_REQUEST).json({message:"Please provide username and password"})
    }
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" })
        }


        let isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (isPasswordCorrect) {
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token: token })
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" })
        }

    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" })
    }
}

const register=async(req, res)=>{
    const{name, username, password}=req.body;

    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide all fields" });
    }

    try{
        const existingUser=await User.findOne({username});
        if(existingUser){
            return res.status(httpStatus.CONFLICT).json({message: "User already exists"});
        }
        const hashedPassword=await bcrypt.hash(password, 10);

        const newUser=new User({
            name: name,
            username: username,
            password: hashedPassword
        });

        await newUser.save();

        res.status(httpStatus.CREATED).json({message:"User Registered"})
    }catch(e){
        if (e.code === 11000) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
}

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        const meetings = await Meeting.find({ user_id: user.username });
        return res.json(meetings);
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e}` });
    }
}

const addToActivity = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({ message: "Added code to activity" });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${e}` });
    }
}

export { login, register, getUserHistory, addToActivity }