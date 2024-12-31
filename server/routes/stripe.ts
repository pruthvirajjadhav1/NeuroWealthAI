import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../../db';
import { users } from '@db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import {  AUTH_CONFIG } from "../config"
import { TimeManager } from '../utils/time-manager';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16' as '2024-12-18.acacia'
    });
    
// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

router.post('/create-checkout-session', async (req: Request, res: Response) => {
      
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'You must be logged in to start a trial' });
      }
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User is not identified' });
      }
    
      try {
          const session = await stripe.checkout.sessions.create({
              line_items: [
                {
                  price: process.env.STRIPE_TEST_PRICE_ID!, // Replace with the actual price ID from Stripe
                  quantity: 1,
                },
              ],
              mode: 'subscription',
              success_url: `${process.env.APP_URL}/trial-success`,
              cancel_url: `${process.env.APP_URL}/trial`,
              metadata: {
                  userId: userId.toString()
              }
            });
    
        
          res.json({ url: session.url });
        } catch (error) {
          console.error('Error creating checkout session:', error);
          res.status(500).json({ error: 'Failed to create checkout session' });
      }
    });
    
    
    router.post(
      "/webhook",
    async (req: Request, res: Response) => {
          const sig = req.headers["stripe-signature"];
            if(!sig) {
                return res.status(400).send('No stripe signature');
            }
          let event;
        try {
          event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err: any) {
          console.error(`Webhook Error: ${err.message}`)
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    
        console.log('Stripe webhook event received:', event.type);
    
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
           const userId = session?.metadata?.userId;
           console.log('[Stripe Webhook]: checkout session completed', {
            sessionId: session.id,
            customer: session.customer,
            userId
          });
            if (userId) {
            try {
              await db.transaction(async (tx: any) => {
                  // Update subscription to trial
                  await tx.update(users).set({
                  subscriptionStatus: 'trial',
                  }).where(eq(users.id, Number(userId)))
              
             });
    
              console.log(`User ${userId} subscription status set to trial`);
    
             } catch (error: any) {
              console.error('Error updating user trial status:', error);
              res.status(400).send(`Webhook Error: ${error.message}`);
             }
            }
          } else if (event.type === 'invoice.payment_succeeded') {
             // Handle successful payment
          const invoice = event.data.object as Stripe.Invoice;
          console.log('[Stripe Webhook]: Invoice Paid', {
            invoiceId: invoice.id,
            status: invoice.status,
            customerId: invoice.customer,
            subscriptionId: invoice.subscription
          })
        
             // Check if it's a recurring payment, not an initial trial payment
              if(invoice.lines.data.some(line => line.price?.id === process.env.STRIPE_TEST_PRICE_ID))
               {
                 try {
                    const userId = invoice?.customer as string
                    const subscriptionId = invoice?.subscription as string
                      //Update Subscription
                      await db.transaction(async (tx: any) => {
                         // Get user by stripeID and if exists then set to active
                         const [user] = await db.select().from(users).where(eq(users.id, Number(userId)));
                           if (user) {
                              await tx.update(users).set({
                                  subscriptionStatus: 'paid',
                              }).where(eq(users.id, Number(userId)))
                              console.log(`User ${user.id} subscription status set to paid`, {
                                  userId: userId,
                                  subscriptionId
                              });
                          }
                    })
                } catch (error: any) {
                  console.error('Failed to update user status:', error);
                      res.status(400).send(`Webhook Error: ${error.message}`);
                 }
                }
           
           
          } else if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object as Stripe.Invoice;
                console.log('[Stripe Webhook]: payment failed', {
                    invoiceId: invoice.id,
                    status: invoice.status,
                    customerId: invoice.customer,
                    subscriptionId: invoice.subscription
                })
            try {
                const userId = invoice?.customer as string;
                const subscriptionId = invoice?.subscription as string
                // Update status to churned
                  await db.transaction(async (tx: any) => {
                       const [user] = await tx.select().from(users).where(eq(users.id, Number(userId)));
                    if(user){
                        await tx.update(users).set({
                          subscriptionStatus: 'churned',
                        }).where(eq(users.id, Number(userId)));
                        console.log(`User ${user.id} subscription status set to churned`, {
                            userId: userId,
                            subscriptionId
                        });
                    }
                  })
                  } catch(error: any){
                      console.error('Error handling payment failed event:', error);
                        res.status(400).send(`Webhook Error: ${error.message}`);
                  }
        } else if(event.type === 'customer.subscription.deleted'){
              const subscription = event.data.object as Stripe.Subscription;
                console.log('[Stripe Webhook]: subscription deleted', {
                  subscriptionId: subscription.id,
                    customerId: subscription.customer
                })
                  try {
                  const userId = subscription?.customer as string;
                      // Update status to churned
                      await db.transaction(async (tx: any) => {
                            const [user] = await tx.select().from(users).where(eq(users.id, Number(userId)));
                            if(user){
                                    await tx.update(users).set({
                                    subscriptionStatus: 'churned',
                                    }).where(eq(users.id, Number(userId)));
                                console.log(`User ${user.id} subscription status set to churned (deleted)`, {
                                userId: userId
                                });
                            }
                    })
                  } catch(error: any){
                    console.error('Error handling subscription deleted:', error);
                    res.status(400).send(`Webhook Error: ${error.message}`);
                }
          }
          res.status(200).json({ received: true });
      
        }
    );
    
     router.post('/update-subscription-status', async (req: Request, res: Response) => {
          const { status } = req.body;
            console.log("[Stripe Update Subscription]: User triggered subscription update", {
                userId: req.user?.id,
                status
            })
            
          if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Not authenticated" });
        }
          if (!["paid", "trial", "churned", "free"].includes(status)) {
            return res.status(400).json({ message: "Invalid subscription status" });
          }
        
          try {
            await db
              .update(users)
              .set({ subscriptionStatus: status })
              .where(eq(users.id, req.user.id));
        
            return res.status(200).json({ message: "Subscription status updated" });
          } catch (error) {
            console.error("Error updating subscription status:", error);
            return res.status(500).json({ message: "Failed to update status" });
          }
        });
    
    export default router;
