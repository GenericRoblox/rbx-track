import axios from 'axios';

export default async function handler(req, res) {
  const { username, userId: inputUserId } = req.query;
  let userId = inputUserId;

  try {
    // Convert username to userId
    if (!userId && username) {
      const userRes = await axios.post(
        'https://users.roblox.com/v1/usernames/users',
        { usernames: [username], excludeBannedUsers: true },
        { headers: { 'Content-Type': 'application/json' } }
      );
      userId = userRes.data.data?.[0]?.id;
      if (!userId) return res.status(404).json({ error: 'Username not found' });
    }

    // Get recent badge
    const badgeListRes = await axios.get(`https://badges.roblox.com/v1/users/${userId}/badges`, {
      params: { sortOrder: 'Desc', limit: 1 }
    });

    const recentBadge = badgeListRes.data.data?.[0];
    if (!recentBadge) return res.status(404).json({ error: 'No recent badge found' });

    // Get awarding universe
    const badgeDetails = await axios.get(`https://badges.roblox.com/v1/badges/${recentBadge.id}`);
    const universeId = badgeDetails.data?.awardingUniverse?.id;

    if (!universeId) return res.status(404).json({ error: 'No game linked to badge' });

    // Fallback: Provide link only
    return res.status(200).json({
      universeId,
      gameLink: `https://www.roblox.com/games?universeId=${universeId}`,
      latestBadge: recentBadge.name,
      badgeAwardedAt: recentBadge.awardedDate
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: 'Roblox request failed.', detail: err.message });
  }
}
