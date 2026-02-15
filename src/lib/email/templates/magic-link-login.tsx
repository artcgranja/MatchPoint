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

interface MagicLinkLoginProps {
  loginUrl: string;
}

export function MagicLinkLoginEmail({ loginUrl }: MagicLinkLoginProps) {
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
          <Section style={headerStyle}>
            <Text style={brandStyle}>MatchPoint</Text>
          </Section>

          <Section style={contentStyle}>
            <Text style={titleStyle}>Sign in to MatchPoint</Text>

            <Text style={paragraphStyle}>
              Click the button below to sign in to your account. This link
              expires in 24 hours.
            </Text>

            <Section style={ctaSection}>
              <Button style={buttonStyle} href={loginUrl}>
                Sign in to MatchPoint
              </Button>
            </Section>

            <Text style={hintStyle}>
              If you didn&apos;t request this email, you can safely ignore it.
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          <Section style={footerSection}>
            <Text style={footerStyle}>
              MatchPoint — AI-powered corporate-startup matching platform.
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
  textAlign: "center" as const,
};

const titleStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#ffffff",
  margin: "0 0 12px 0",
};

const paragraphStyle = {
  fontSize: "14px",
  lineHeight: "1.7",
  color: "#a0a0b0",
  margin: "0 0 24px 0",
};

const ctaSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
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

const hintStyle = {
  fontSize: "12px",
  color: "#6b6b80",
  margin: "0",
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
