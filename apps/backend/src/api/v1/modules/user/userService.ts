import mongoose from "mongoose";

import User from "../../models/User";

const userService = {
  updateUserRole: async (userId: string, role: string, companyId: string) => {
    try {
      const result = await User.updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        {
          $set: {
            role,
            companyId,
            companySetupCompletedAt: new Date(),
          },
        }
      );

      return result;
    } catch (error) {
      throw error;
    }
  },
};

export default userService;
