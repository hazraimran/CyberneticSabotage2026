import UserResponse from "../models/UserResponse.js";

const createSurvey = async(req,res)=>{
  let {username,responses} =req.body;

  if(!username){
      return res.status(400).json({ error: "Missing required fields" });
  }

  try{
      let user_res = await UserResponse.findOne({ username });
      if(!user_res){
          user_res = new UserResponse({username,responses});
      }else{
          const num=Math.floor(Math.random()*100);
          username = "user"+num;
          user_res = new UserResponse({username,responses});
      }
      await user_res.save();
      res.status(200).json("Response have been stored successfully");
  }catch(err){
      console.error(err);
      res.status(500).json({ error: "Server error" });
  }
}

export { createSurvey };
