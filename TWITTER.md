Built an open-source ad blocker for Kick.com. Blocks Google GPT and IMA SDK ads at the network, script, and DOM level before they even load.

Three layers: declarativeNetRequest domain blocking, frozen googletag/IMA stubs injected at document_start, and a MutationObserver cleanup as fallback.

Zero data collection. Zero telemetry. Fully audited. MIT licensed.

Looking for testers -- especially in the US where Kick casino ads are reportedly active. Casino category is geo-blocked in Europe so I had to test through a VPN, which may have suppressed ad delivery.

If an ad slips through, there's a report button built into every stream page.

github.com/Pkkls/kick-ad-blocker

#KickAdBlocker #Kick #AdBlock #OpenSource #BrowserExtension #ManifestV3 #NoAds #KickStreaming #FreeAndOpenSource #PrivacyFirst
