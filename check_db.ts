import { connectToDatabase } from "./src/lib/mongodb";
import User from "./src/models/User";
import Lead from "./src/models/Lead";
import Campaign from "./src/models/Campaign";

async function check() {
  await connectToDatabase();
  const userCount = await User.countDocuments();
  const activeUserCount = await User.countDocuments({ isActive: true });
  const users = await User.find({}, 'name role isActive');
  const leadCount = await Lead.countDocuments();
  const campaignCount = await Campaign.countDocuments();

  console.log({
    userCount,
    activeUserCount,
    users,
    leadCount,
    campaignCount
  });
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
