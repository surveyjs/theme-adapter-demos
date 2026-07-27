"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, Col, Row } from "react-bootstrap";
import { navItems, themedPath } from "@adapter/schemas";
import { DEFAULT_THEME, isColorThemeId } from "@/lib/themes";

/**
 * Landing page. Cards link to theme-prefixed routes (`/<theme>/<page>`).
 */
export default function HomePage() {
  const params = useParams<{ theme: string }>();
  const theme = isColorThemeId(params.theme) ? params.theme : DEFAULT_THEME;

  return (
    <Row className="g-3">
      {navItems.map((item) => (
        <Col key={item.id} xs={12} sm={6} xl={3}>
          <Card
            as={Link}
            href={themedPath(theme, item.path)}
            className="h-100 text-decoration-none text-reset shadow-sm"
          >
            <Card.Body>
              <Card.Title className="h5">{item.label}</Card.Title>
              <Card.Text className="text-body-secondary">
                {item.description}
              </Card.Text>
            </Card.Body>
            <Card.Footer className="bg-transparent border-0 text-primary small">
              Open {item.label} →
            </Card.Footer>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
