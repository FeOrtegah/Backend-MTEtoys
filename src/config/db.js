import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI no está definida en las variables de entorno"
      );
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(
      `MongoDB conectado: ${conn.connection.host}`
    );
  } catch (error) {
    console.error(
      `Error al conectar MongoDB: ${error.message}`
    );

    process.exit(1);
  }
};

export default connectDB;