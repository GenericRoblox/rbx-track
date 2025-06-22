import axios from 'axios';

export default async function handler(req, res) {
  let userId = req.query.userId;
  const username = req.query.username;

  try {
    console.log("STEP 1: Starting...");

    // Convert username to userId
    if (!userId && username) {
      const userRes = await axios.post(
        'https://users.roblox.com/v1/usernames/users',
        { usernames: [username], excludeBannedUsers: true },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          }
        }
      );
      userId = userRes.data.data?.[0]?.id;
      if (!userId) return res.status(404).json({ step: "username->userId", error: "Username not found" });
    }

    if (!userId) return res.status(400).json({ error: "Missing userId or username" });
    console.log("STEP 2: Got userId", userId);

    // Get most recent badge
    const badgeListRes = await axios.get(
      `https://badges.roblox.com/v1/users/${userId}/badges`,
      {
        params: { sortOrder: "Desc", limit: 1 },
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }
    );
    const recentBadge = badgeListRes.data.data?.[0];
    if (!recentBadge) return res.status(404).json({ step: "badges", error: "No badges found" });
    console.log("STEP 3: Got badge", recentBadge.name);

    // Get badge details
    const badgeDetails = await axios.get(
      `https://badges.roblox.com/v1/badges/${recentBadge.id}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }
    );
    const universeId = badgeDetails.data?.awardingUniverse?.id;
    if (!universeId) return res.status(404).json({ step: "badgeDetails", error: "No universe found" });
    console.log("STEP 4: Got universeId", universeId);

    // Get game details
    const gameRes = await axios.get(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }
    );
    const game = gameRes.data?.data?.[0];
    if (!game) return res.status(404).json({ step: "game", error: "No game found for universe" });

    console.log("STEP 5: Got game", game.name);

    return res.status(200).json({
      step: "success",
      gameName: game.name,
      gameDescription: game.description,
      gameLink: `https://www.roblox.com/games/${game.rootPlaceId}`,
      placeId: game.rootPlaceId,
      latestBadge: recentBadge.name,
      badgeAwardedAt: recentBadge.awardedDate
    });

  } catch (error) {
    console.error("FULL ERROR:", error);
    return res.status(500).json({
      step: "exception",
      message: error.message,
      response: error.response?.data || "No response body",
      status: error.response?.status || "Unknown status"
    });
  }
}
