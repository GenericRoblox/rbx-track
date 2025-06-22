import axios from 'axios';

export default async function handler(req, res) {
  let userId = req.query.userId;
  const username = req.query.username;

  // Global headers to avoid 401 errors
  const axiosConfig = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Origin': 'https://www.roblox.com',
      'Referer': 'https://www.roblox.com'
    }
  };

  try {
    // Step 1: Convert username to userId if needed
    if (!userId && username) {
      const userRes = await axios.post(
        'https://users.roblox.com/v1/usernames/users',
        {
          usernames: [username],
          excludeBannedUsers: true
        },
        axiosConfig
      );

      userId = userRes.data.data?.[0]?.id;
      if (!userId) {
        return res.status(404).json({ error: 'Username not found.' });
      }
    }

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId or username.' });
    }

    // Step 2: Get the user's most recent badge
    const badgesRes = await axios.get(
      `https://badges.roblox.com/v1/users/${userId}/badges`,
      {
        params: { sortOrder: 'Desc', limit: 1 },
        ...axiosConfig
      }
    );

    const recentBadge = badgesRes.data.data?.[0];
    if (!recentBadge) {
      return res.status(404).json({ error: 'No recent badges found.' });
    }

    // Step 3: Get detailed info for the badge (to find awardingUniverse)
    const badgeDetailsRes = await axios.get(
      `https://badges.roblox.com/v1/badges/${recentBadge.id}`,
      axiosConfig
    );

    const universeId = badgeDetailsRes.data?.awardingUniverse?.id;
    if (!universeId) {
      return res.status(404).json({ error: 'Badge has no linked universe/game.' });
    }

    // Step 4: Get game data from the universe ID
    const gameRes = await axios.get(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`,
      axiosConfig
    );

    const game = gameRes.data?.data?.[0];
    if (!game) {
      return res.status(404).json({ error: 'Game not found for universe.' });
    }

    // Final result
    return res.status(200).json({
      gameName: game.name,
      gameDescription: game.description,
      gameLink: `https://www.roblox.com/games/${game.rootPlaceId}`,
      placeId: game.rootPlaceId,
      latestBadge: recentBadge.name,
      badgeAwardedAt: recentBadge.awardedDate
    });

  } catch (error) {
    console.error("❌ Fetch error:", error.message);
    return res.status(500).json({
      error: 'Failed to fetch Roblox data.',
      details: error.response?.data || error.message
    });
  }
}
