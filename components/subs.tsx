import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SubscribeDrawer({ create }: any) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    // Replace with your subscription logic

    create(email);

    setSubscribed(true);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Follow me</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subscribe</DialogTitle>
          <DialogDescription>
            Let just connect the old-fashioned way. Enter your email to
            subscribe I will personally send you an email and we talk.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="your-email@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubscribe} disabled={subscribed}>
            Subscribe
          </Button>
        </DialogFooter>
        {subscribed && (
          <p className="mt-4 text-green-500">Email sent successfully!</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
