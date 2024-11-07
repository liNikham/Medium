import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'

const app = new Hono<{
   Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
   }
}>()

app.use('/api/v1/blog/*',async (c,next)=>{
  const header = c.req.header("authorization") || "";
  const response = await verify(header.split(" ")[1],c.env.JWT_SECRET);
  if(!response){
    c.status(403);
    return c.json({error:"Unauthorized"})
  }
  await next()
})

app.post('/api/v1/signup',async (c)=>{
   console.log(c.env.DATABASE_URL)
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
}).$extends(withAccelerate())
  const body = await c.req.json();
  try{
    const user = await prisma.user.create({
       data: {
         email: body.email,
         password: body.password,
       },
     })
     const token = await sign({id: user.id},c.env.JWT_SECRET);
     return c.json({jwt:token})
  }
  catch(e){
     c.status(403);
     return c.json({error:"Error while sigining up"});
  }
})
app.post('/api/v1/signin', async (c)=>{
     	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const user = await prisma.user.findUnique({
		where: {
			email: body.email
		}
	});

	if (!user) {
		c.status(403);
		return c.json({ error: "user not found" });
	}

	const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
	return c.json({ jwt });
})

app.post('/api/v1/blog',(c)=>{
  return c.text('Hello World')
})

app.put('/api/v1/blog',(c)=>{
  return c.text('Hello World')
})

app.get('/api/v1/blog/:id',(c)=>{
  return c.text('Hello World')
})
export default app
