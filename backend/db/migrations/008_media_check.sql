-- Common-space media have no context_id; every other context must have one.
ALTER TABLE Media ADD CONSTRAINT media_context_id_chk
  CHECK ((context IN ('apartment-common', 'pro-space-common')) = (context_id IS NULL));
