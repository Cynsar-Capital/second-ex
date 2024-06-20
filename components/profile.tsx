// components/ProfileComponent.js
"use client";

import Image from "next/image";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal } from "lucide-react";
import Link from "next/link";

import { parseISO, format } from "date-fns";
import { SubscribeDrawer } from "./subs";

const profile = {
  name: "Saransh Sharma",
  email: "saransh@cynsar.capital",
  avatar:
    "https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
  backgroundImage:
    "https://images.unsplash.com/photo-1444628838545-ac4016a5418a?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
  fields: [
    ["Phone", "+1 X.X>X.X.X"],
    ["Email", "saransh@cynsar.capital"],
    ["Title", "No Title as such"],
    ["Location's", "US/Europe/India"],
  ],
  about:
    "A generic about me is fine for now, sorry didnt use Chat gpt for this one. I think that I can summarise a lot of thoughts and express them clearly as you can see I am not interested in making a ton of impression in one go, As I am not selling myself.",
  work: [
    {
      position: "Chief in whatever",
      company: "Upscale Tech, India",
      years: "2013 - 2015",
      respo:
        "Co founded a tech company with a friend about as I was about 20 years old at that time, worked delivering while learning on software stacks with Fortis Healthcare, Ministry of Defence, learned a lot about coding, digital tech , maths and everything else about how to make software products for companies large companies sir.",
    },
    {
      position: "Tech Guy",
      company: "Decimus Financials",
      years: "2015 - 2016",
      respo:
        "I was direct in line with the Guy who funded the NBFC , an asset based company that wanted to digitise the entire NBFC products, ran multiple pilot and live production level teams to deliver product for scale. We forked open source MIFOS X now Apache Fineract. Amazing time, learned a lot of deeper stuff on managing teams, work etc.",
    },
    {
      position: "Financial Technology",
      company: "Solo",
      years: "2016 - 2018",
      respo:
        "I had understood how and what the market needed while working as tech guy with a financial company, decided to start off another venture that would make financial tech tools for NBFC and banks and provided through API but didn't have money scored some bit of funding from a private Investor in Delhi but couldn't get a team to work lots of infighting and leadership issues.",
    },
    {
      position: "Freedom as Freelancer",
      company: "Solo",
      years: "2018 - 2019",
      respo:
        "Too much of work with people, wanted to take an off, so decided to move out of Delhi to Pune and worked for various Marketing Company advising and building great tech products which are still live and working(wow) , worked for wallet company in Netherlands, developed a wallet on  Bitcoin tech stack then again...",
    },
    {
      position: "Travel as a Nomad",
      company: "Solo",
      years: "2019 - 2021",
      respo:
        "Quit everything and then travelled in India , South of India, North of India, started doing Vipasana a mediation technique and deeply involved in Bitcoin community , went to Israel for a tech workshop and travelled breifly to Eastern Europe",
    },
    {
      position: "Research/ Tech / Product",
      company: "Muellners Aps/ Foundation",
      years: "2019 - 2021",
      respo:
        "Worked briefly with my sibling , living in Denmark we packaged the banking tech stuff to banks all around the world, to be honest it was boring and I wanted to do something else.",
    },
    {
      position: "Whatever you call it",
      company: "Cynsar Capital",
      years: "2021- Present",
      respo:
        "Started an investment firm that will specialise in investing innovative tier 3 cities. Borrowed funds from my girlfriend  but couldn't find a right method to do it hence had to return the money, Later used the firm to develop founding playbook it operates three businesses in India 1) Jaal Yantra Textiles, 2)Cynsar Foundation, 3) Black Cheetah Traders ",
    },
  ],
};

const ProfileComponent = ({ posts, author, create }: any) => {
  return (
    <div className="relative min-h-screen dark:bg-slate-800 bg-gray-50 py-6 sm:py-12 text-black dark:text-white flex justify-center overflow-hidden">
      <Image
        src="/se.jpeg"
        alt=""
        className="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        width="1308"
        height={128}
      />
      <div className="absolute inset-0 bg-[url(/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <div className="space-y-6 max-w-4xl w-full relative">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            Linkedin is fine, they sell data thats fine too, they do bad stuff
            and thats fine too, because of them many things are bad but thats
            fine too,I have created a personal page that is self hosted no more
            Linkedin sending me stuff who viewed my profile 100 times. This is
            my link where you will find almost everything that you expect on
            Linkedin{" "}
          </AlertDescription>
        </Alert>
        <div className="relative dark:bg-slate-800 bg-gray-50 overflow-hidden">
          <div>
            <div className="absolute top-20 left-4">
              <Image
                className="h-24 w-24 rounded-full ring-8 ring-white sm:h-32 sm:w-32"
                src={author.profile_image}
                alt="Profile"
                width={128}
                height={128}
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 mt-16 sm:mt-32 ml-32">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <div className="mt-6 flex space-x-4">
              <SubscribeDrawer create={create} />
            </div>
            <dl className="mt-6 flex flex-col sm:flex-row sm:flex-wrap">
              {profile.fields.map(([field, value]) => (
                <div key={field} className="sm:w-1/2 mt-2">
                  <dt className="text-sm font-medium text-gray-400">{field}</dt>
                  <dd className="mt-1 text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="dark:bg-slate-800 bg-gray-60 overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold mb-4 line-through">About</h2>
            <p>{profile.about}</p>
          </div>
        </div>

        <div className="dark:bg-slate-800 bg-gray-60 overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold mb-4 underline decoration-sky-500">
              Work
            </h2>
            <ul className="space-y-4">
              {profile.work.map((job, index) => (
                <li
                  key={index}
                  className="dark:bg-slate-800  p-4 rounded-lg shadow"
                >
                  <h3 className="text-xl font-semibold">{job.position}</h3>
                  <p>{job.respo}</p>
                  <p className="text-gray-400">{job.company}</p>
                  <p className="text-gray-500">{job.years}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="dark:bg-slate-800 bg-gray-50 overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl font-bold mb-4">Updates from my blog</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <li key={post.id} className="dark:bg-slate-800 p-4 rounded-lg">
                  <Link href={post.url}>
                    <div className="relative w-full">
                      {post.feature_image ? (
                        <Image
                          fill
                          src={post.feature_image}
                          alt=""
                          className="rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl" />
                      )}
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <h3 className="text-xl font-semibold">{post.title}</h3>
                    <time dateTime={post.created_at}>
                      {format(parseISO(post.created_at), "LLLL d, yyyy")}
                    </time>
                    <p className="text-gray-400 indent-8">{post.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileComponent;
