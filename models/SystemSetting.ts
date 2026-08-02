import mongoose, { Document, Schema, Model } from "mongoose";

export interface ISystemSetting extends Document {
  key: string;
  value: string;
  updatedAt: Date;
}

export interface ISystemSettingModel extends Model<ISystemSetting> {
  getSetting(key: string, fallback: string): Promise<string>;
  setSetting(key: string, value: string): Promise<ISystemSetting>;
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

systemSettingSchema.statics.getSetting = async function (
  key: string,
  fallback: string,
): Promise<string> {
  const doc = await this.findOne({ key });
  return doc ? doc.value : fallback;
};

systemSettingSchema.statics.setSetting = async function (
  key: string,
  value: string,
): Promise<ISystemSetting> {
  return this.findOneAndUpdate(
    { key },
    { key, value },
    { upsert: true, new: true },
  );
};

export const SystemSetting = (mongoose.models.SystemSetting ||
  mongoose.model<ISystemSetting, ISystemSettingModel>(
    "SystemSetting",
    systemSettingSchema,
  )) as ISystemSettingModel;
