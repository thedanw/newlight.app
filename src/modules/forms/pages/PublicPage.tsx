import {useEffect, useState} from "react";
import type {CSSProperties} from "react";
import {useParams} from "react-router-dom";
import {Button, Card, Field, Heading, Input, Text, Textarea} from "@/core/ui";
import {Stack, VStack} from "styled-system/jsx";
import {css} from "styled-system/css";
import {FileText} from "lucide-react";
import {getFormById, submitForm} from "../lib/queries";
import {PageSkeleton} from "../../people/components/PageSkeleton";
import type {FormWithFields} from "../lib/types";

const pageCss = css({
    minHeight: "100dvh",
    display: "grid",
    placeItems: "center",
    padding: "6",
    background: "var(--canvas-bg)",
});

const cardCss = css({
    width: "100%",
    maxWidth: "48rem",
});

export default function FormPublicPage() {
    // Route param is `:id` (see routes.tsx); aliased to the local name used below.
    const {id: formId} = useParams();
    const [form, setForm] = useState<FormWithFields | null>(null);
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!formId) return;
        console.log("Fetching form:", formId);
        getFormById(formId)
        .then((loaded) => {
            console.log("Form loaded:", loaded);
            setForm(loaded);
            setLoading(false);
        })
        .catch((reason: unknown) => {
            console.error("Form load error:", reason);
            setError(reason instanceof Error ? reason.message : "Unable to load form.");
            setLoading(false);
        });
    }, [formId]);

    if (loading)
        return (
            <main className={pageCss}>
                <Card.Root className={cardCss}>
                    <Card.Body>
                        <PageSkeleton />
                    </Card.Body>
                </Card.Root>
            </main>
        );
    if (error)
        return (
            <main className={pageCss}>
                <Card.Root className={cardCss}>
                    <Card.Body>
                        <VStack>
                            <Heading>Error</Heading>
                            <Text>{error}</Text>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            </main>
        );
    if (!form)
        return (
            <main className={pageCss}>
                <Card.Root className={cardCss}>
                    <Card.Body>
                        <VStack>
                            <Heading>Form not found</Heading>
                            <Text color="fg.muted">The form you're looking for doesn't exist.</Text>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            </main>
        );
    if (!form.is_public)
        return (
            <main className={pageCss}>
                <Card.Root className={cardCss}>
                    <Card.Body>
                        <VStack>
                            <Heading>Form not available</Heading>
                            <Text color="fg.muted">This form is not accepting submissions.</Text>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            </main>
        );

    const setAnswer = (fieldId: string, value: unknown) => setAnswers((current) => ({...current, [fieldId]: value}));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        try {
            await submitForm(form.id, answers);
            setSubmitted(true);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to submit form.");
        }
    };

    if (submitted) {
        return (
            <main className={pageCss}>
                <Card.Root className={cardCss}>
                    <Card.Body>
                        <VStack>
                            <Heading>
                                {(form.settings as {thank_you_message?: string} | null)?.thank_you_message ??
                                    "Thanks for submitting!"}
                            </Heading>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            </main>
        );
    }

    return (
        <main className={pageCss}>
            <Card.Root className={cardCss}>
                <Card.Body>
                    <VStack>
                        <Heading>{form.name}</Heading>
                        {form.description && <Text color="fg.muted">{form.description}</Text>}
                        <form onSubmit={handleSubmit}>
                            <Stack>
                                {form.fields.map((field) => {
                                    const value = answers[field.id];
                                    return (
                                        <Field.Root key={field.id}>
                                            <Field.Label>
                                                {field.label}
                                                {field.required ? " *" : ""}
                                            </Field.Label>
                                            {field.field_type === "textarea" && (
                                                <Textarea
                                                    value={String(value ?? "")}
                                                    onChange={(event) => setAnswer(field.id, event.target.value)}
                                                    placeholder={field.placeholder ?? undefined}
                                                />
                                            )}
                                            {field.field_type === "select" && (
                                                <select
                                                    value={String(value ?? "")}
                                                    onChange={(event) => setAnswer(field.id, event.target.value)}>
                                                    <option value="">Select...</option>
                                                    {(field.options as {label: string; value: string}[] | null)?.map(
                                                        (option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            )}
                                            {field.field_type === "multi_select" && (
                                                <div>
                                                    {(field.options as {label: string; value: string}[] | null)?.map(
                                                        (option) => {
                                                            const selected = Array.isArray(value)
                                                                ? value.includes(option.value)
                                                                : false;
                                                            return (
                                                                <label key={option.value}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selected}
                                                                        onChange={(event) => {
                                                                            const current = Array.isArray(value)
                                                                                ? (value as string[])
                                                                                : [];
                                                                            setAnswer(
                                                                                field.id,
                                                                                event.target.checked
                                                                                    ? [...current, option.value]
                                                                                    : current.filter(
                                                                                          (item) =>
                                                                                              item !== option.value
                                                                                      )
                                                                            );
                                                                        }}
                                                                    />
                                                                    {option.label}
                                                                </label>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            )}
                                            {field.field_type === "checkbox" && (
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={value === true}
                                                        onChange={(event) => setAnswer(field.id, event.target.checked)}
                                                    />
                                                    {field.label}
                                                </label>
                                            )}
                                            {field.field_type === "email" && (
                                                <Input
                                                    type="email"
                                                    value={String(value ?? "")}
                                                    onChange={(event) => setAnswer(field.id, event.target.value)}
                                                    placeholder={field.placeholder ?? undefined}
                                                />
                                            )}
                                            {field.field_type === "phone" && (
                                                <Input
                                                    type="tel"
                                                    value={String(value ?? "")}
                                                    onChange={(event) => setAnswer(field.id, event.target.value)}
                                                    placeholder={field.placeholder ?? undefined}
                                                />
                                            )}
                                            {field.field_type === "number" && (
                                                <Input
                                                    type="number"
                                                    value={String(value ?? "")}
                                                    onChange={(event) => setAnswer(field.id, event.target.value)}
                                                    placeholder={field.placeholder ?? undefined}
                                                />
                                            )}
                                            {field.field_type === "date" && (
                                                <Input
                                                    type="date"
                                                    value={String(value ?? "")}
                                                    onChange={(event) => setAnswer(field.id, event.target.value)}
                                                />
                                            )}
                                            {field.field_type === "text" && (
                                                <Input
                                                    value={String(value ?? "")}
                                                    onChange={(event) => setAnswer(field.id, event.target.value)}
                                                    placeholder={field.placeholder ?? undefined}
                                                />
                                            )}
                                        </Field.Root>
                                    );
                                })}
                                {error && <Text color="error">{error}</Text>}
                                <Button type="submit">Submit</Button>
                            </Stack>
                        </form>
                    </VStack>
                </Card.Body>
            </Card.Root>
        </main>
    );
}
