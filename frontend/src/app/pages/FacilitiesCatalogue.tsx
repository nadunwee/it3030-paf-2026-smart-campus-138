import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { StatusPill } from '../components/StatusPill'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Card, CardContent } from '../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Search, Filter, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '@/api/client'
import {
  buildListQuery,
  facilityTypeLabels,
  type ResourceResponse,
  type SpringPage,
} from '@/api/resource'

const ITEMS_PER_PAGE = 5

export default function FacilitiesCatalogue() {
  const { user, isAdmin } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterLocation, setFilterLocation] = useState('')
  const [minCapacity, setMinCapacity] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [pageData, setPageData] = useState<SpringPage<ResourceResponse> | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchPage = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const cap = minCapacity.trim() ? parseInt(minCapacity, 10) : undefined
      const loc =
        (filterLocation.trim() || searchQuery.trim()) || undefined
      const q = buildListQuery({
        page: currentPage - 1,
        size: ITEMS_PER_PAGE,
        type: filterType,
        capacityMin: cap != null && !Number.isNaN(cap) ? cap : undefined,
        location: loc,
        status:
          isAdmin && filterStatus !== 'ALL' ? filterStatus : undefined,
      })
      const data = await apiFetch<SpringPage<ResourceResponse>>(
        `/api/v1/resources?${q}`,
      )
      setPageData(data)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load resources')
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }, [
    currentPage,
    filterType,
    filterStatus,
    filterLocation,
    minCapacity,
    searchQuery,
    isAdmin,
  ])

  useEffect(() => {
    void fetchPage()
  }, [fetchPage])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const rows = pageData?.content ?? []
  const totalPages = pageData?.totalPages ?? 0
  const totalElements = pageData?.totalElements ?? 0
  const startIndex = totalElements === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE

  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl">Facilities & Assets Catalogue</h1>
          <p className="text-muted-foreground">
            Browse and manage bookable resources across campus
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by location or keywords…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleFilterChange()
                    }}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="filter-type">Type</Label>
                    <Select
                      value={filterType}
                      onValueChange={(value) => {
                        setFilterType(value)
                        handleFilterChange()
                      }}
                    >
                      <SelectTrigger id="filter-type">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="LECTURE_HALL">Lecture Hall</SelectItem>
                        <SelectItem value="LAB">Lab</SelectItem>
                        <SelectItem value="MEETING_ROOM">Meeting Room</SelectItem>
                        <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-status">Status</Label>
                    <Select
                      value={filterStatus}
                      onValueChange={(value) => {
                        setFilterStatus(value)
                        handleFilterChange()
                      }}
                      disabled={!isAdmin}
                    >
                      <SelectTrigger id="filter-status">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-location">Location</Label>
                    <Input
                      id="filter-location"
                      placeholder="Filter by location"
                      value={filterLocation}
                      onChange={(e) => {
                        setFilterLocation(e.target.value)
                        handleFilterChange()
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-capacity">Min. Capacity</Label>
                    <Input
                      id="filter-capacity"
                      type="number"
                      placeholder="e.g., 20"
                      value={minCapacity}
                      onChange={(e) => {
                        setMinCapacity(e.target.value)
                        handleFilterChange()
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading
              ? 'Loading…'
              : `Showing ${totalElements === 0 ? 0 : startIndex + 1}–${Math.min(startIndex + rows.length, totalElements)} of ${totalElements} results`}
          </p>
        </div>

        {loadError && (
          <p className="text-sm text-destructive mb-4" role="alert">
            {loadError}
          </p>
        )}

        <Card>
          <CardContent className="p-0">
            {loading && rows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Loading…</div>
            ) : !loading && rows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No facilities found matching your criteria.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterType('ALL')
                    setFilterStatus('ALL')
                    setFilterLocation('')
                    setMinCapacity('')
                    setCurrentPage(1)
                  }}
                  className="mt-2"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((facility) => (
                        <TableRow key={facility.id}>
                          <TableCell className="font-mono text-sm">
                            {facility.id}
                          </TableCell>
                          <TableCell className="font-medium max-w-[220px] truncate">
                            {facilityTypeLabels[facility.type]} · {facility.location}
                          </TableCell>
                          <TableCell>{facilityTypeLabels[facility.type]}</TableCell>
                          <TableCell>{facility.capacity}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {facility.location}
                          </TableCell>
                          <TableCell>
                            <StatusPill status={facility.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link to={`/facilities/${facility.id}`}>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Eye className="h-4 w-4" />
                                  <span className="hidden sm:inline">View</span>
                                </Button>
                              </Link>
                              {isAdmin && (
                                <Link to={`/facilities/${facility.id}/edit`}>
                                  <Button variant="ghost" size="sm" className="gap-1">
                                    <Edit className="h-4 w-4" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {Math.max(1, totalPages)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages || loading}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
