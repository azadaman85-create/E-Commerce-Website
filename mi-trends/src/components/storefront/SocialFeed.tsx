"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, staggerGrid, inViewOnce, EASE_TACTILE } from "@/lib/motion";
import { InstagramIcon } from "@/components/ui/BrandIcons";
import type { SocialPost } from "@/types";

export function SocialFeed({ posts }: { posts: SocialPost[] }) {
  if (posts.length === 0) return null;

  return (
    <motion.div
      {...inViewOnce}
      variants={staggerGrid}
      className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6"
    >
      {posts.map((post) => (
        <motion.div key={post.id} variants={fadeUp}>
          <Link
            href={post.link ?? "/products"}
            className="group relative block aspect-square overflow-hidden rounded-sm bg-cream"
            aria-label={post.caption ?? "Social post"}
          >
            <motion.div
              className="absolute inset-0"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.6, ease: EASE_TACTILE }}
            >
              <Image
                src={post.image_url}
                alt={post.caption ?? ""}
                fill
                sizes="(max-width: 768px) 50vw, 16vw"
                className="object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-300 group-hover:bg-ink/35 group-hover:opacity-100">
              <InstagramIcon className="h-6 w-6 text-white" />
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
