# /brag plan: Jeong Wallet

**What it is:** a passkey wallet. Your fingerprint, face or device PIN owns an ERC-4337 smart account (Coinbase Smart Account via viem). There's no seed phrase and no password, and the app stores no secret.
**Who it's for:** developers who want to see every layer of a modern wallet (passkey, account, bundler, dApp connection) working on their own machine.
**What sets it apart:** you sign with a passkey instead of a seed phrase, the whole stack runs locally (Anvil fork + Alto bundler + Nuxt), and it has a hand-drawn notebook design (paper, ink, a coral heart). The name 정 (jeong) means a deep, warm bond, and the logo is a fingerprint that becomes a heart.
**Most impressive claim:** "No seed phrase to write down." Signing up takes one tap, and the first send also deploys the account.
**Visual hook:** a seed phrase gets scribbled out in red pen, then the fingerprint heart draws itself in.
**Real UI shown:** the app itself running in Chromium, with a virtual passkey authenticator and a mocked chain. Snapshots come from its live DOM: onboarding (phone), then fund, send and batch (desktop).
**Tone:** `default`: punchy, playful, clean. It stays in the notebook world: paper, ruled lines, a red margin, Gaegu and Caveat handwriting.
**Share caption:** "No seed phrase, just your fingerprint."

## Angle
Wallets usually open by asking you to write down 12 words. Jeong opens with a fingerprint instead. The video crosses out the seed phrase, then shows the real app: sign up with one tap, send with a review step and a passkey, and batch several calls behind one signature.

## Storyboard (landscape 1920×1080, 30 fps, 112 BPM, ~22.5 s)

| # | Time | Scene | On screen |
|---|---|---|---|
| 1 | 0.00–3.75 | Hook | Notebook page. 12 handwritten seed words appear, then a red pen scribbles them out. **"No seed phrase."** slams in, followed by *"just your fingerprint ♡"* |
| 2 | 3.75–7.50 | Reveal | The fingerprint loops of the logo draw themselves into a heart. The lockup "Jeong 정 · wallet" appears with the tagline **"A wallet that lives on your device."** (the app's own hero copy) and a margin note: *"a fingerprint that becomes a heart ♡ = 정"* |
| 3 | 7.50–11.79 | Sign up | Phone showing the real onboarding. A tap on "Create wallet with passkey" switches the button to "Waiting for your passkey…", a passkey sheet appears, then "Your wallet is ready" with the check drawing in. Caption: **"One tap. One fingerprint."** |
| 4 | 11.79–16.61 | Send | Desktop notebook app, real send page. Pick "Savings", tap 0.25, and the review updates live ("✦ this first transaction also creates your account"). Confirm and send, approve with your passkey, then "0.25 ETH sent". Sticky note: **"Check twice, send once."** (the page's own subtitle) |
| 5 | 16.61–19.29 | Batch | Real batch review, "One UserOp, 2 calls" (ETH + mUSDC). Caption **"Many calls, one signature."** with pills: Tokens · Batch · Sign · Connect |
| 6 | 19.29–22.50 | Outro | Logo + lockup, **"A passkey smart-account wallet."**, and the repo URL |

## Sound
An original track synthesized for this video: 112 BPM in F major, I–vi–IV–V, with a warm electric piano, a round bass, a soft kick and brushed hats. Scene 1 is sparse (keys and pencil), and the groove comes in on the reveal. The sound effects are built from the same palette: a pencil scribble, taps tuned to F and C, and passkey "success" chimes on chord tones, all mixed under the music.
