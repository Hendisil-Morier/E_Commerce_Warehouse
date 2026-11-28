using ECommerceWarehouse.Application.Contracts.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace ECommerceWarehouse.Infrastructure.Services;

public class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string User { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromName { get; set; } = "E-Commerce Warehouse";
    public string FromAddress { get; set; } = string.Empty;
    public bool IsDevelopment { get; set; }
}

public class MailKitEmailSender : IEmailSender
{
    private readonly EmailSettings _settings;

    public MailKitEmailSender(EmailSettings settings)
    {
        _settings = settings;
    }

    public bool IsSmtpConfigured =>
        !string.IsNullOrWhiteSpace(_settings.Host) &&
        !string.IsNullOrWhiteSpace(_settings.User) &&
        !string.IsNullOrWhiteSpace(_settings.Password) &&
        !string.IsNullOrWhiteSpace(_settings.FromAddress);

    public async Task SendEmailAsync(
        string toEmail,
        string subject,
        string htmlBody,
        string? plainTextBody = null,
        CancellationToken cancellationToken = default)
    {
        if (!IsSmtpConfigured)
        {
            if (_settings.IsDevelopment)
            {
                Console.WriteLine("========== [DEV EMAIL FALLBACK - SMTP NOT CONFIGURED] ==========");
                Console.WriteLine($"To: {toEmail}");
                Console.WriteLine($"Subject: {subject}");
                Console.WriteLine(plainTextBody ?? htmlBody);
                Console.WriteLine("=================================================================");
                return;
            }

            throw new InvalidOperationException(
                "EmailSettings SMTP chưa được cấu hình đầy đủ (Host, User, Password, FromAddress) cho môi trường hiện tại.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

        var builder = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = plainTextBody
        };
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(_settings.Host, _settings.Port, SecureSocketOptions.StartTls, cancellationToken);
        await client.AuthenticateAsync(_settings.User, _settings.Password, cancellationToken);
        await client.SendAsync(message, cancellationToken: cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
