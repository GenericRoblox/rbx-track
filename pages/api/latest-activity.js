import axios from 'axios';

export default async function handler(req, res) {
  let userId = req.query.userId;
  const username = req.query.username;

  try {
    // Step 1: Convert username to userId if needed
    if (!userId && username) {
      const userRes = await axios.post(
        'https://users.roblox.com/v1/usernames/users',
        { usernames: [username], excludeBannedUsers: true },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
        }
      );
      userId = userRes.data.data[0]?.id;
      if (!userId) return res.status(404).json({ error: 'Username not found.' });
    }

    if (!userId) return res.status(400).json({ error: 'Missing userId or username.' });

    // Step 2: Get recent badges
    const badgeRes = await axios.get(
      `https://badges.roblox.com/v1/users/${userId}/badges`,
      {
        params: { sortOrder: 'Desc', limit: 1 },
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );

    const recentBadge = badgeRes.data.data?.[0];
    if (!recentBadge) return res.status(404).json({ error: 'No recent badges found.' });

    // Step 3: Get details about the badge to retrieve the awardingUniverse
    const badgeDetailRes = await axios.get(
      `https://badges.roblox.com/v1/badges/${recentBadge.id}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    const universeId = badgeDetailRes.data?.awardingUniverse?.id;
    if (!universeId) return res.status(404).json({ error: 'No game info tied to the badge.' });

    // Step 4: Get game info from universe ID
    const universeRes = await axios.get(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    const game = universeRes.data.data?.[0];
    if (!game) return res.status(404).json({ error: 'Game not found.' });

    return res.status(200).json({
      gameName: game.name,
      gameDescription: game.description,
      gameLink: `https://www.roblox.com/games/${game.rootPlaceId}`,
      placeId: game.rootPlaceId,
      latestBadge: recentBadge.name,
      badgeAwardedAt: recentBadge.awardedDate,
    });

  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch Roblox data.' });
  }
}
