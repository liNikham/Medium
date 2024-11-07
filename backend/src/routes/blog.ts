import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
export const blogRouter = new Hono<{
   Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
   },
   Variables: {
    userID: string
   }
}>();

blogRouter.use('/*',async (c,next)=>{
  const header = c.req.header("authorization") || "";
  const response = await verify(header.split(" ")[1],c.env.JWT_SECRET);
  if(!response){
    c.status(403);
    return c.json({error:"Unauthorized"})
  }
  else{
  c.set("userID",String(response.id));
  await next()
  }
})

blogRouter.post('/',async (c)=>{
   const body = await c.req.json();
   const userID = c.get("userID");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
   const blog = await prisma.post.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: userID
        },
        })
        return c.json(blog)
  
})

blogRouter.put('/:id',async(c)=>{
    const id = c.req.param('id');
    const body = await c.req.json();
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
    const blog = await prisma.post.update({
        where: { id: id },
        data: {
            title: body.title,
            content: body.content
        },
    })
    return c.json(blog)
})


blogRouter.get('/bulk',async (c)=>{
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
    const blog = await prisma.post.findMany();
    return c.json(blog)
})

blogRouter.get('/:id', async(c)=>{
    try{
    const id = c.req.param('id');
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
    const blog = await prisma.post.findUnique({
        where: { id: id }
    })
    return c.json(blog)
}
catch(e){
    c.status(404);
    return c.json({error:"Error while getting blog"})
}
})