/** @typedef {import('grammy').Context} Context */

async function replyOrEditText(ctx, text, opts) {
  const msg = ctx.callbackQuery?.message;
  if (msg) {
    if ("photo" in msg && msg.photo?.length) {
      try {
        await ctx.deleteMessage();
      } catch {
        // stale or already removed
      }
      await ctx.reply(text, opts);
      return;
    }
    try {
      await ctx.editMessageText(text, opts);
      return;
    } catch {
      // fall through to reply
    }
  }
  await ctx.reply(text, opts);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function testPhotoCallbackUsesReplyNotEdit() {
  const calls = [];
  const ctx = {
    callbackQuery: { message: { photo: [{ file_id: "x" }] } },
    deleteMessage: async () => {
      calls.push("delete");
    },
    reply: async () => {
      calls.push("reply");
    },
    editMessageText: async () => {
      calls.push("edit");
    },
  };
  await replyOrEditText(ctx, "city step", { reply_markup: {} });
  assert(calls.includes("delete"), "photo message should be deleted");
  assert(calls.includes("reply"), "photo message should trigger reply");
  assert(!calls.includes("edit"), "photo message must not use editMessageText");
}

async function testTextCallbackUsesEdit() {
  const calls = [];
  const ctx = {
    callbackQuery: { message: { text: "menu" } },
    deleteMessage: async () => calls.push("delete"),
    reply: async () => calls.push("reply"),
    editMessageText: async () => calls.push("edit"),
  };
  await replyOrEditText(ctx, "city step", { reply_markup: {} });
  assert(calls.includes("edit"), "text message should be edited");
  assert(!calls.includes("reply"), "text message should not reply");
}

async function testNoCallbackUsesReply() {
  const calls = [];
  const ctx = {
    reply: async () => calls.push("reply"),
    editMessageText: async () => calls.push("edit"),
  };
  await replyOrEditText(ctx, "city step", {});
  assert(calls.includes("reply"), "no callback should reply");
}

async function main() {
  await testPhotoCallbackUsesReplyNotEdit();
  await testTextCallbackUsesEdit();
  await testNoCallbackUsesReply();
  console.log("OK: messaging tests passed");
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
