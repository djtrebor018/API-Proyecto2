import jwt from 'jsonwebtoken'


export const Jwt = (uid='' )=>{
    return  jwt.sign({uid},process.env.JWT_SECRET,{
        expiresIn: '2h'
    })
}