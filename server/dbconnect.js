import mongoose from "mongoose";
async function connectmongo(url){
   try{
    

    let connecttioninstance= await mongoose.connect(`${url}/chat-app`);
    console.log(`succesfully mongo  db connected ${connecttioninstance.connection.host}`);
    return connecttioninstance;
  
    
}
catch(err) {
    console.log("MongoDB connection error: ", err);
    process.exit(-1);
  }
   }
export default connectmongo;