import axios from 'axios';

export default async function handler(req, res) {
  let userId = req.query.userId;
  const username = req.query.username;

  try {
    // Convert username to userId
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
      userId = userRes.data.data[0]?.id;
      if (!userId) {
        return res.status(404).json({ error: 'Username not found.' });
      }
    }

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId or username.' });
    }

    // Look for recent badge with a valid Place
    let cursor = null;
    let foundBadge = null;
    let attempts = 0;

    while (attempts < 5 && !foundBadge) {
      const badgeRes = await axios.get(
        `https://badges.roblox.com/v1/users/${userId}/badges`,
        {
          params: {
            sortOrder: 'Desc',
            limit: 100,
            cursor: cursor || undefined,
          },
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      const { data, nextPageCursor } = badgeRes.data;
      if (!data || data.length === 0) break;

      for (const badge of data) {
        if (badge.awarder?.type === 'Place' && badge.awarder?.id) {
          foundBadge = badge;
          break;
        }
      }

      cursor = nextPageCursor;
      attempts++;
    }

    if (!foundBadge) {
      return res.status(404).json({ error: 'No badge tied to a game found.' });
    }

    const placeId = foundBadge.awarder.id;
    const gameLink = `https://www.roblox.com/games/${placeId}`;

    const gameRes = await axios.get(
      `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const game = gameRes.data[0];
    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    return res.status(200).json({
      gameName: game.name,
      gameDescription: game.description,
      gameLink,
      placeId,
      latestBadge: foundBadge.name,
      badgeAwardedAt: foundBadge.awardedDate
    });

  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch Roblox data.' });
  }
}
