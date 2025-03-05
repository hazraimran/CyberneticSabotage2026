import User from "../models/User.js";


const register = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user) {
        return res.status(400).json({ error: "User already exists" });
    }
    const newUser = new User({ username, password });
    await newUser.save();
    res.status(200).json({ message: "User registered successfully", user: newUser, isVerified: true });
};

const login = async (req, res) => {

    const { username,password } = req.body; // Access username from query parameters

    try {
        let user = await User.findOne({ username });
        
        if (!user) {
            return res.status(200).json({username,isVerified:false}); // Handle user not found
        } else if(user.password !== password) {
            return res.status(401).json({error:"Invalid password", isVerified:false});
        } else {
            return res.status(200).json({user,isVerified:true});
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

export { register, login };
