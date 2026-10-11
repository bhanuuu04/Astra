import { NextRequest, NextResponse } from 'next/server';
import { SocialMessage, BrandAssetRegistry } from '@/types/threat';
import { DEFAULT_BRAND_REGISTRY } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, targetType, brand } = body as {
      message: SocialMessage;
      targetType: 'platform_impersonation' | 'rogue_app' | 'domain_phishing' | 'telegram_abuse';
      brand?: BrandAssetRegistry;
    };

    const activeBrand = brand || DEFAULT_BRAND_REGISTRY;
    const sender = message.sender;
    const analysis = message.analysis;

    // Platform abuse endpoints & reference URLs
    const contactMatrix: Record<string, { email: string; portal: string; policy: string }> = {
      x_twitter: {
        email: 'safety@x.com',
        portal: 'https://help.x.com/forms/impersonation',
        policy: 'X Brand Impersonation & Deceptive Identity Policy'
      },
      instagram: {
        email: 'ip@instagram.com',
        portal: 'https://help.instagram.com/contact/636276399721841',
        policy: 'Meta Brand Rights Protection & Impersonation Policy'
      },
      telegram: {
        email: 'abuse@telegram.org',
        portal: 'https://t.me/notoscam',
        policy: 'Telegram Scam & Fraudulent Bot Terms of Service'
      },
      google_play: {
        email: 'googleplay-developer-support@google.com',
        portal: 'https://support.google.com/googleplay/android-developer/contact/takedown',
        policy: 'Google Play Malware & Impersonation Policy'
      },
      registrar: {
        email: 'abuse@registrar-whois.org',
        portal: 'ICANN WHOIS Abuse Portal',
        policy: 'ICANN Registrar Accreditation Agreement Phishing Takedown'
      }
    };

    // Extract artifacts
    const urls = analysis.extractedArtifacts.filter(a => a.type === 'url').map(a => a.value);
    const apks = analysis.extractedArtifacts.filter(a => a.type === 'apk').map(a => a.value);

    let subject = '';
    let bodyText = '';
    const destination = contactMatrix[message.platform] || contactMatrix.x_twitter;

    if (targetType === 'rogue_app' || apks.length > 0) {
      subject = `[URGENT TAKEDOWN] Malicious Counterfeit Mobile App Impersonating ${activeBrand.brandName}`;
      bodyText = `ATTN: Mobile Security & Abuse Operations Desk

We represent ${activeBrand.legalEntity}, owners of the registered trademark "${activeBrand.brandName}".

We have identified an active, unauthorized distribution of a counterfeit and malicious mobile application mimicking our official brand software:

TARGET INFRINGEMENT DETAILS:
- Counterfeit App / Payload: ${apks.join(', ') || 'Rogue APK File'}
- Source Ingestion Channel: ${message.platform.toUpperCase()} DM from handle @${sender.username}
- Distribution URL: ${urls.join(', ') || 'N/A'}
- Discovered Timestamp: ${message.timestamp}

LEGITIMATE INTELLECTUAL PROPERTY & OFFICIAL APPS:
- Official Brand Name: ${activeBrand.brandName}
- Official Website: ${activeBrand.officialDomains[0]}
- Authorized Mobile Application: ${activeBrand.officialMobileApps.map(a => `${a.name} (${a.identifier})`).join(', ')}

THREAT INTELLIGENCE SUMMARY:
Astra Threat Analysis has scored this threat at ${analysis.riskScore}/100 [CRITICAL].
Indicators:
${analysis.indicators.map(i => `- ${i.title}: ${i.description}`).join('\n')}

REQUESTED ACTION:
Pursuant to intellectual property laws and mobile app safety standards, we demand the immediate suspension, blocking, and removal of this unauthorized application and hosting domain to protect consumers from malware and credential theft.

Authorized Contact:
${activeBrand.contactEmail}
Brand Security Operations Center, ${activeBrand.legalEntity}`;
    } else {
      subject = `[DMCA / ABUSE NOTICE] Immediate Takedown Request: Impersonator Account @${sender.username} on ${message.platform.toUpperCase()}`;
      bodyText = `ATTN: Trust & Safety / Brand Protection Team

We are writing on behalf of ${activeBrand.legalEntity} to formally report an unauthorized, fraudulent account actively impersonating our brand and engaging in deceptive social engineering against users.

OFFENDING ACCOUNT DETAILS:
- Platform: ${message.platform.toUpperCase()}
- Offending Handle: @${sender.username}
- Display Name: "${sender.displayName}"
- Profile ID: ${sender.id}
- Incident Message Timestamp: ${message.timestamp}

EVIDENCE OF IMPERSONATION & FRAUD:
The offending account has contacted users via Direct Message while displaying our brand name without authorization. 
Astra Forensic Risk Score: ${analysis.riskScore}/100 [${analysis.severity.toUpperCase()}]
Impersonation Confidence: ${analysis.impersonationScore}%

Message Context Captured:
"${message.content}"

Detected Phishing Links / Payloads:
${urls.length > 0 ? urls.join('\n') : 'Direct Social Engineering / Fraudulent Customer Support Representation'}

OFFICIAL VERIFIED ASSETS:
- Official Brand: ${activeBrand.brandName}
- Official Handle: @${activeBrand.officialHandles.find(h => h.platform === message.platform)?.handle || activeBrand.officialHandles[0].handle}
- Official Domain: ${activeBrand.officialDomains[0]}

REQUESTED REMEDY:
We request the immediate suspension and permanent deactivation of @${sender.username} in accordance with your platform's Anti-Impersonation and Fraud policies.

Authorized Legal & Security Representative:
${activeBrand.contactEmail}
Global Brand Protection Office, ${activeBrand.legalEntity}`;
    }

    return NextResponse.json({
      success: true,
      takedownDossier: {
        targetType,
        platform: message.platform,
        destination,
        subject,
        bodyText,
        riskScore: analysis.riskScore,
        offenderHandle: sender.username,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate takedown dossier' },
      { status: 500 }
    );
  }
}
