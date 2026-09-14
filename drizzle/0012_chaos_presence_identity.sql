-- Presence includes website, Discord, and guest identities.
ALTER TABLE "chaos_presence" DROP CONSTRAINT IF EXISTS "chaos_presence_userId_user_id_fk";
