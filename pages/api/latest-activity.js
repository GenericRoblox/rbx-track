import axios from 'axios';

export default async function handler(req, res) {
  let userId = req.query.userId;
  const username = req.query.username;

  try {
    // Step 1: Convert username to userId
    if (!userId && username) {
      const userRes = await axios.post(
        'https://users.roblox.com/v1/usernames/users',
        { usernames: [username], excludeBannedUsers: true },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          }
        }
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
        params: {
          sortOrder: 'Desc',
          limit: 1
        },
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const badge = badgesRes.data.data?.[0];
    if (!badge) {
      return res.status(404).json({ error: 'No recent badges found.' });
    }

    // Step 3: Get detailed badge info to extract awardingUniverse
    const badgeDetailsRes = await axios.get(
      `https://badges.roblox.com/v1/badges/${badge.id}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const universeId = badgeDetailsRes.data?.awardingUniverse?.id;
    if (!universeId) {
      return res.status(404).json({ error: 'No universe linked to badge.' });
    }

    // Step 4: Get the game data from the universe
    const gameRes = await axios.get(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const game = gameRes.data?.data?.[0];
    if (!game) {
      return res.status(404).json({ error: 'Game not found for universe.' });
    }

    return res.status(200).json({
      gameName: game.name,
      gameDescription: game.description,
      gameLink: `https://www.roblox.com/games/${game.rootPlaceId}`,
      placeId: game.rootPlaceId,
      latestBadge: badge.name,
      badgeAwardedAt: badge.awardedDate
    });

  } catch (error) {
    console.error('❌ FULL ERROR:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to fetch Roblox data.' });
  }
}
