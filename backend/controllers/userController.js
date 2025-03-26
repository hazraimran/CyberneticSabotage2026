import User from "../models/User.js";

const getUsers = async (req, res) => {
  try {
      const users = await User.find({});
      res.json(users);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch users" });
  }
};


// New POST endpoint to receive user data
const submitUserData = async (req, res) => {
  const { username, queryIndex, queryTime, hintsUsed, query, isCorrect,score, personalizedSettings } = req.body;

  // Validate required fields
  if (!username || queryIndex === undefined || queryTime === undefined || hintsUsed === undefined || query === undefined || isCorrect === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
  }

  try {
      // Find or create user document
      let user = await User.findOne({ username });
      if (!user) {
          user = new User({ username, totalQueriesSolved: 0});
      }         
      //update score
      user.score=score;
      
      //update personalized settings
      user.personalizedSettings = personalizedSettings;
      // Add new question data
      user.questions.push({
          questionId: queryIndex,
          timeUsed: queryTime,
          query,
          isCorrect,
          hintsUsed,
      });

      //updateQueriesSolved
      user.totalQueriesSolved = parseInt(user?.questions?.[user.questions.length - 1]?.questionId,10);


      await user.save();
      res.status(200).json({ message: "Data saved successfully" });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
  }
};

export { getUsers, submitUserData };
