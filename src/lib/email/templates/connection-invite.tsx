import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Font,
} from "@react-email/components";

interface ConnectionInviteProps {
  startupName: string;
  subject: string;
  body: string;
  inviteUrl: string;
  seekerCompany?: string;
}

export function ConnectionInviteEmail({
  startupName,
  body,
  inviteUrl,
  seekerCompany,
}: ConnectionInviteProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Space Grotesk"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2",
            format: "woff2",
          }}
        />
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={brandStyle}>MatchPoint</Text>
          </Section>

          {/* Body */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>Hi {startupName} team,</Text>

            <Text style={paragraphStyle}>{body}</Text>

            {seekerCompany && (
              <Text style={metaStyle}>
                From: {seekerCompany} via MatchPoint
              </Text>
            )}

            <Section style={ctaSection}>
              <Button style={buttonStyle} href={inviteUrl}>
                View connection request
              </Button>
            </Section>
          </Section>

          <Hr style={dividerStyle} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerStyle}>
              This email was sent via MatchPoint — an AI-powered
              corporate-startup matching platform.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#0a0a0f",
  fontFamily: "'Space Grotesk', Arial, sans-serif",
  margin: "0",
  padding: "0",
};

const containerStyle = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 20px",
};

const headerStyle = {
  textAlign: "center" as const,
  paddingBottom: "24px",
};

const brandStyle = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#ffffff",
  margin: "0",
};

const contentStyle = {
  backgroundColor: "#111118",
  borderRadius: "10px",
  border: "1px solid #1e1e2e",
  padding: "32px",
};

const greetingStyle = {
  fontSize: "16px",
  color: "#ffffff",
  fontWeight: "600",
  margin: "0 0 16px 0",
};

const paragraphStyle = {
  fontSize: "14px",
  lineHeight: "1.7",
  color: "#a0a0b0",
  margin: "0 0 20px 0",
  whiteSpace: "pre-wrap" as const,
};

const metaStyle = {
  fontSize: "12px",
  color: "#6b6b80",
  margin: "0 0 24px 0",
};

const ctaSection = {
  textAlign: "center" as const,
};

const buttonStyle = {
  backgroundColor: "#3b82f6",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const dividerStyle = {
  borderColor: "#1e1e2e",
  margin: "24px 0",
};

const footerSection = {
  textAlign: "center" as const,
};

const footerStyle = {
  fontSize: "12px",
  color: "#4a4a5a",
  margin: "0",
};
