using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.UnitTests.Common;

public class PaginationTests
{
    [Theory]
    [InlineData(0, 1)]
    [InlineData(-5, 1)]
    [InlineData(1, 1)]
    [InlineData(3, 3)]
    public void NormalizedPage_ClampsMinimumToOne(int inputPage, int expectedPage)
    {
        var query = new PaginationQuery { Page = inputPage };
        Assert.Equal(expectedPage, query.NormalizedPage);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-10, 1)]
    [InlineData(20, 20)]
    [InlineData(100, 100)]
    [InlineData(500, 100)]
    public void NormalizedPageSize_ClampsBetweenOneAndMaxPageSize(int inputPageSize, int expectedPageSize)
    {
        var query = new PaginationQuery { PageSize = inputPageSize };
        Assert.Equal(expectedPageSize, query.NormalizedPageSize);
    }

    [Fact]
    public void Skip_CalculatesFromNormalizedPageAndPageSize()
    {
        var query = new PaginationQuery { Page = 3, PageSize = 250 };
        Assert.Equal(200, query.Skip);
    }

    [Theory]
    [InlineData(null, "createdAt", true)]
    [InlineData("", "createdAt", true)]
    [InlineData("   ", "createdAt", true)]
    [InlineData("-createdAt", "createdAt", true)]
    [InlineData("+createdAt", "createdAt", false)]
    [InlineData("price", "price", false)]
    [InlineData("-price", "price", true)]
    [InlineData("-", "createdAt", true)]
    [InlineData("+", "createdAt", false)]
    public void ParseSort_ReturnsExpectedFieldAndDirection(
        string? sort,
        string expectedField,
        bool expectedIsDescending)
    {
        var query = new PaginationQuery { Sort = sort };
        var (field, isDescending) = query.ParseSort();

        Assert.Equal(expectedField, field);
        Assert.Equal(expectedIsDescending, isDescending);
    }

    [Theory]
    [InlineData(0, 20, 0)]
    [InlineData(20, 20, 1)]
    [InlineData(21, 20, 2)]
    [InlineData(-4, 20, 0)]
    public void PagedResult_Create_CalculatesTotalPagesAndNormalizesInputs(
        int totalItems,
        int pageSize,
        int expectedTotalPages)
    {
        var items = new[] { "a", "b" };
        var result = PagedResult<string>.Create(items, page: 0, pageSize: pageSize, totalItems: totalItems);

        Assert.Equal(1, result.Page);
        Assert.Equal(pageSize, result.PageSize);
        Assert.Equal(Math.Max(0, totalItems), result.TotalItems);
        Assert.Equal(expectedTotalPages, result.TotalPages);
        Assert.Equal(items, result.Items);
    }

    [Fact]
    public void PagedResult_Create_ClampsExcessivePageSizeToMaxPageSize()
    {
        var result = PagedResult<int>.Create([1, 2, 3], page: 2, pageSize: 999, totalItems: 250);

        Assert.Equal(2, result.Page);
        Assert.Equal(PaginationQuery.MaxPageSize, result.PageSize);
        Assert.Equal(3, result.TotalPages);
    }
}

